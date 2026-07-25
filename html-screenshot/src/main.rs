use base64::Engine;
use chromiumoxide::{
    Page,
    browser::{Browser, BrowserConfig},
    cdp::browser_protocol::{
        emulation::SetDeviceMetricsOverrideParams,
        page::{CaptureScreenshotFormat, CaptureScreenshotParams, Viewport},
    },
};
use clap::Parser;
use futures::StreamExt;
use image::DynamicImage;
use std::path::{Path, PathBuf};

/// Convert each slide in an HTML presentation to a PNG image.
#[derive(Parser, Debug)]
#[command(name = "html-screenshot", version, about)]
struct Args {
    /// Path to the HTML presentation file
    html: PathBuf,

    /// Output directory for generated images
    #[arg(short, long, default_value = ".")]
    output: PathBuf,

    /// Resolution level (720, 1080, 1440, 2160). For landscape slides (w > h),
    /// the long edge (width) maps to the corresponding pixel count (1280, 1920,
    /// 2560, 3840); the short edge preserves the slide's original aspect ratio.
    /// For portrait slides (h > w), the long edge (height) maps accordingly.
    #[arg(short, long, default_value_t = 1080)]
    resolution: u32,

    /// Slide range to export, e.g. "1-3" or "2,5,7" or "1-3,8,10". 1-indexed.
    #[arg(short = 'n', long, default_value = "")]
    range: String,

    /// Filename prefix for output images. Output: {prefix}-1.png, {prefix}-2.png, ...
    #[arg(short, long, default_value = "")]
    prefix: String,

    /// Invert brightness of output images (dark mode)
    #[arg(long, default_value_t = false)]
    invert: bool,

    /// Path to Chromium/Chrome executable
    #[arg(long, env = "CHROME_PATH")]
    chrome_path: Option<PathBuf>,
}

fn parse_range(range: &str, total: usize) -> Vec<usize> {
    if range.is_empty() {
        return (0..total).collect();
    }
    let mut indices = Vec::new();
    for part in range.split(',') {
        let part = part.trim();
        if part.contains('-') {
            let mut bounds = part.splitn(2, '-');
            let start: usize = bounds
                .next()
                .unwrap()
                .trim()
                .parse()
                .expect("invalid range start");
            let end: usize = bounds
                .next()
                .unwrap()
                .trim()
                .parse()
                .expect("invalid range end");
            for i in start..=end {
                if i >= 1 && i <= total {
                    indices.push(i - 1);
                }
            }
        } else {
            let idx: usize = part.parse().expect("invalid range index");
            if idx >= 1 && idx <= total {
                indices.push(idx - 1);
            }
        }
    }
    indices.sort();
    indices.dedup();
    indices
}

fn invert_brightness(img: &mut DynamicImage) {
    let rgba_img = img.to_rgba8();
    let mut output = rgba_img.clone();
    for (x, y, pixel) in rgba_img.enumerate_pixels() {
        let rgba = pixel.0;
        output.put_pixel(
            x,
            y,
            image::Rgba([255 - rgba[0], 255 - rgba[1], 255 - rgba[2], rgba[3]]),
        );
    }
    *img = DynamicImage::ImageRgba8(output);
}

/// Inject a <style> tag to hide nav elements and disable body centering,
/// then measure the active slide's bounding rect.
async fn prepare_and_measure_slide(
    page: &Page,
    slide_index: usize,
) -> Result<(f64, f64, f64, f64), Box<dyn std::error::Error>> {
    // 1. Activate the target slide
    let activate_js = format!(
        "(() => {{ \
            const slides = document.querySelectorAll('.slide'); \
            slides.forEach(s => {{ s.style.display = 'none'; s.classList.remove('active'); }}); \
            const cur = slides[{}]; \
            if (cur.classList.contains('slide-title')) {{ cur.style.display = 'flex'; }} \
            else {{ cur.style.display = 'block'; }} \
            cur.classList.add('active'); \
        }})()",
        slide_index
    );
    page.evaluate_expression(&activate_js).await?;
    tokio::time::sleep(std::time::Duration::from_millis(300)).await;

    // 2. Inject a style tag to hide nav/dots/numbers and remove body centering
    //    Use a unique ID so we can remove it later.
    //    NOTE: Do NOT override max-width/width on .presentation-container —
    //    that would stretch the slide to fill the viewport and distort the
    //    aspect ratio. We keep the slide's natural layout width.
    page.evaluate_expression(
        r#"(() => {
            let tag = document.getElementById('__screenshot_style');
            if (!tag) {
                tag = document.createElement('style');
                tag.id = '__screenshot_style';
                document.head.appendChild(tag);
            }
            tag.textContent = `
                .navigation-bar { display: none !important; }
                .dot-indicators  { display: none !important; }
                .slide-number    { display: none !important; }
                body {
                    padding: 0 !important;
                    margin: 0 !important;
                    min-height: 0 !important;
                    display: block !important;
                    justify-content: initial !important;
                    align-items: initial !important;
                }
                .presentation-container {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            `;
        })()"#,
    )
    .await?;
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;

    // 3. Measure the active slide's bounding rect (unscaled, natural size)
    let bounds_js = r#"
        (() => {
            const slide = document.querySelector('.slide.active');
            if (!slide) return JSON.stringify({x:0,y:0,w:0,h:0});
            const r = slide.getBoundingClientRect();
            return JSON.stringify({x:r.x, y:r.y, w:r.width, h:r.height});
        })()
    "#;
    let bounds_str: String = page.evaluate_expression(bounds_js).await?.into_value()?;

    let v: serde_json::Value = serde_json::from_str(&bounds_str)?;
    let x = v["x"].as_f64().unwrap_or(0.0);
    let y = v["y"].as_f64().unwrap_or(0.0);
    let w = v["w"].as_f64().unwrap_or(0.0);
    let h = v["h"].as_f64().unwrap_or(0.0);

    Ok((x, y, w, h))
}

/// Remove the injected screenshot style tag.
async fn cleanup_screenshot_style(page: &Page) -> Result<(), Box<dyn std::error::Error>> {
    page.evaluate_expression(
        "(() => { const tag = document.getElementById('__screenshot_style'); if(tag) tag.remove(); })()"
    ).await?;
    Ok(())
}

async fn screenshot_slide(
    page: &Page,
    slide_index: usize,
    target_long_edge: u32,
) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    // 1. Prepare slide and measure its natural bounding rect (at scale 1.0)
    let (nat_x, nat_y, nat_w, nat_h) = prepare_and_measure_slide(page, slide_index).await?;

    if nat_w == 0.0 || nat_h == 0.0 {
        eprintln!("Warning: slide {} has zero dimensions", slide_index + 1);
        let params = CaptureScreenshotParams::builder()
            .format(CaptureScreenshotFormat::Png)
            .build();
        let result = page.execute(params).await?;
        let base64_str: &str = result.result.data.as_ref();
        cleanup_screenshot_style(page).await?;
        return Ok(base64::engine::general_purpose::STANDARD.decode(base64_str)?);
    }

    // 2. Convert resolution level to target long-edge pixel count.
    //    1080 → 1920px, 720 → 1280px, 1440 → 2560px, 2160 → 3840px.
    //    The relationship: long_edge_px = resolution * 16 / 9
    let target_long_edge = (target_long_edge as f64 * 16.0 / 9.0).round() as u32;

    // 3. Calculate scale so the slide's longer edge equals target_long_edge
    let long_edge = nat_w.max(nat_h);
    let scale = target_long_edge as f64 / long_edge;

    // 3. Set device_scale_factor while keeping the same CSS viewport size (1920x3840).
    //    This tells Chromium to render at higher pixel density, scaling both
    //    width and height uniformly. The page layout stays unchanged — only the
    //    output pixel density increases.
    page.execute(SetDeviceMetricsOverrideParams::new(
        1920, 3840, scale, false,
    ))
    .await?;
    tokio::time::sleep(std::time::Duration::from_millis(300)).await;

    // 4. Clip-capture the slide area. The clip coordinates are in CSS pixels
    //    (the API accounts for device_scale_factor internally).
    let clip = Viewport::builder()
        .x(nat_x)
        .y(nat_y)
        .width(nat_w)
        .height(nat_h)
        .scale(1.0)
        .build()
        .expect("all viewport fields are set");

    let params = CaptureScreenshotParams::builder()
        .format(CaptureScreenshotFormat::Png)
        .clip(clip)
        .capture_beyond_viewport(true)
        .build();

    let result = page.execute(params).await?;
    let base64_str: &str = result.result.data.as_ref();
    let bytes = base64::engine::general_purpose::STANDARD.decode(base64_str)?;

    // 5. Restore original device metrics (scale 1.0)
    page.execute(SetDeviceMetricsOverrideParams::new(1920, 3840, 1.0, false))
        .await?;

    // 6. Remove injected screenshot style
    cleanup_screenshot_style(page).await?;

    Ok(bytes)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    // Validate HTML file
    if !args.html.exists() {
        eprintln!("Error: HTML file not found: {:?}", args.html);
        std::process::exit(1);
    }
    let html_path = args.html.canonicalize()?;

    // Create output directory if needed
    std::fs::create_dir_all(&args.output)?;

    // Detect Chrome path
    let chrome_path = args.chrome_path.unwrap_or_else(|| {
        let candidates = [
            "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium",
            "/usr/bin/chromium-browser",
            "/usr/bin/chromium",
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ];
        candidates
            .iter()
            .find(|p| Path::new(p).exists())
            .map(PathBuf::from)
            .unwrap_or_else(|| {
                eprintln!(
                    "Error: Chrome/Chromium not found. Set --chrome-path or CHROME_PATH env."
                );
                std::process::exit(1);
            })
    });

    // Use a large viewport so slides render at their natural CSS size
    // Width: typical presentation width; Height: plenty of room
    let browser_width = 1920u32;
    let browser_height = 3840u32; // 2x 1080p height for headroom

    let browser_config = BrowserConfig::builder()
        .chrome_executable(chrome_path)
        .arg("--no-sandbox")
        .arg("--disable-gpu")
        .arg("--disable-dev-shm-usage")
        .arg("--hide-scrollbars")
        .window_size(browser_width, browser_height)
        .build()?;

    let (mut browser, mut handler) = Browser::launch(browser_config).await?;

    let handler_task = tokio::spawn(async move {
        while let Some(event) = handler.next().await {
            if let Err(e) = event {
                eprintln!("Handler error: {:?}", e);
            }
        }
    });

    // Open a page
    let page = browser.new_page("about:blank").await?;

    // Set viewport size
    page.execute(SetDeviceMetricsOverrideParams::new(
        browser_width as i64,
        browser_height as i64,
        1.0,
        false,
    ))
    .await?;

    // Load the HTML file
    let file_url = format!("file://{}", html_path.display());
    page.goto(&file_url).await?;

    // Wait for page to fully load (highlight.js, fonts, etc.)
    tokio::time::sleep(std::time::Duration::from_secs(2)).await;

    // Count total slides
    let total_str: String = page
        .evaluate_expression("String(document.querySelectorAll('.slide').length)")
        .await?
        .into_value()?;
    let total_slides: usize = total_str.trim().parse()?;
    eprintln!("Found {} slides", total_slides);

    if total_slides == 0 {
        eprintln!("Error: No slides found in the HTML file.");
        std::process::exit(1);
    }

    // Parse range
    let slide_indices = parse_range(&args.range, total_slides);
    if slide_indices.is_empty() {
        eprintln!("Error: No valid slides in the specified range.");
        std::process::exit(1);
    }
    eprintln!(
        "Exporting slide(s): {}",
        slide_indices
            .iter()
            .map(|i| format!("{}", i + 1))
            .collect::<Vec<_>>()
            .join(", ")
    );

    // Screenshot each slide
    for (output_idx, &slide_idx) in slide_indices.iter().enumerate() {
        eprintln!(
            "Capturing slide {}/{} (slide #{})...",
            output_idx + 1,
            slide_indices.len(),
            slide_idx + 1
        );

        let bytes = screenshot_slide(&page, slide_idx, args.resolution).await?;

        // Load image and optionally invert brightness
        let mut img = image::load_from_memory(&bytes)?;

        if args.invert {
            invert_brightness(&mut img);
        }

        // Generate filename
        let filename = if args.prefix.is_empty() {
            format!("{:02}.png", slide_idx + 1)
        } else {
            format!("{}-{:02}.png", args.prefix, slide_idx + 1)
        };
        let output_path = args.output.join(&filename);

        img.save(&output_path)?;
        eprintln!(
            "  Saved: {} ({}x{})",
            output_path.display(),
            img.width(),
            img.height()
        );
    }

    browser.close().await?;
    handler_task.await?;

    eprintln!("Done! Exported {} slide(s).", slide_indices.len());
    Ok(())
}
