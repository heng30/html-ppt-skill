#!/usr/bin/env bash

all: build

build:
	cargo build --release

build-static-linux: build
	CC_x86_64_unknown_linux_musl=x86_64-unknown-linux-musl-gcc cargo build --release --target x86_64-unknown-linux-musl

debug:
	RUST_LOG=debug cargo run

clean:
	cargo clean

check:
	cargo check

install-linux: build-static-linux
	cp ./target/x86_64-unknown-linux-musl/release/html-screenshot ~/.local/bin/
