const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const url = process.argv[2];
  const outPath = process.argv[3] || "/tmp/nxp_pw.html"; // 不传就用默认

  if (!url) {
    console.error("用法: node fetch2.js <URL> [输出文件路径]");
    process.exit(1);
  }

  const browser = await chromium.launch({
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });

  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  await page.goto(url, { waitUntil: "load", timeout: 90000 });

  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(3000);
    const t = await page.title();
    console.log(i, t, page.url());
    if (!/Just a moment|Attention Required/i.test(t)) break;
  }

  const html = await page.content();
  fs.writeFileSync(outPath, html);
  console.log("saved to", outPath, "len", html.length);

  await browser.close();
})();
