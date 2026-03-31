.PHONY: help install dev build clean setup build-dmr build-dmr-all package package-mac package-linux package-windows package-all

help: ## 显示帮助信息
	@echo "DMR Desktop - 可用命令:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## 配置 Rust 工具链
	@echo "配置 Rust 工具链..."
	@if ! command -v rustup &> /dev/null; then \
		echo "错误: rustup 未安装，请访问 https://rustup.rs/ 安装"; \
		exit 1; \
	fi
	@mkdir -p ~/.rustup/downloads
	rustup default stable
	@echo "Rust 工具链配置完成!"

install: setup ## 安装依赖
	@echo "安装前端依赖..."
	npm install
	@echo "构建 DMR 二进制..."
	@$(MAKE) build-dmr
	@echo "依赖安装完成!"

build-dmr: ## 构建 DMR 二进制文件
	@echo "构建当前平台 DMR..."
	@mkdir -p src-tauri/binaries
	@mkdir -p src-tauri/target/debug
	cd ../dmr && go build -o ../dmr-desktop/src-tauri/binaries/dmr ./cmd/dmr
	@# 复制到 target/debug 用于开发模式
	cp src-tauri/binaries/dmr src-tauri/target/debug/dmr
	@# 检测当前平台并创建对应的 Tauri 命名文件
	@if [ "$$(uname -s)" = "Darwin" ]; then \
		if [ "$$(uname -m)" = "arm64" ]; then \
			cp src-tauri/binaries/dmr src-tauri/binaries/dmr-aarch64-apple-darwin; \
			echo "已创建 dmr-aarch64-apple-darwin"; \
		else \
			cp src-tauri/binaries/dmr src-tauri/binaries/dmr-x86_64-apple-darwin; \
			echo "已创建 dmr-x86_64-apple-darwin"; \
		fi \
	elif [ "$$(uname -s)" = "Linux" ]; then \
		cp src-tauri/binaries/dmr src-tauri/binaries/dmr-x86_64-unknown-linux-gnu; \
		echo "已创建 dmr-x86_64-unknown-linux-gnu"; \
	fi
	@echo "DMR 构建完成!"

build-dmr-all: ## 构建所有平台的 DMR
	@echo "构建 macOS ARM64..."
	cd ../dmr && GOOS=darwin GOARCH=arm64 go build -o ../dmr-desktop/src-tauri/binaries/dmr-aarch64-apple-darwin ./cmd/dmr
	@echo "构建 macOS x86_64..."
	cd ../dmr && GOOS=darwin GOARCH=amd64 go build -o ../dmr-desktop/src-tauri/binaries/dmr-x86_64-apple-darwin ./cmd/dmr
	@echo "构建 Linux x86_64..."
	cd ../dmr && GOOS=linux GOARCH=amd64 go build -o ../dmr-desktop/src-tauri/binaries/dmr-x86_64-unknown-linux-gnu ./cmd/dmr
	@echo "构建 Windows x86_64..."
	cd ../dmr && GOOS=windows GOARCH=amd64 go build -o ../dmr-desktop/src-tauri/binaries/dmr-x86_64-pc-windows-msvc.exe ./cmd/dmr
	@echo "所有平台 DMR 构建完成!"

dev: build-dmr ## 启动开发模式
	npm run tauri:dev

build: build-dmr ## 构建生产版本
	npm run tauri:build

package-mac: ## 打包 macOS 版本（需要在 macOS 上运行）
	@echo "打包 macOS 版本..."
	@# 构建 macOS ARM64 DMR
	@mkdir -p src-tauri/binaries
	cd ../dmr && GOOS=darwin GOARCH=arm64 go build -o ../dmr-desktop/src-tauri/binaries/dmr-aarch64-apple-darwin ./cmd/dmr
	@# 构建 macOS x86_64 DMR
	cd ../dmr && GOOS=darwin GOARCH=amd64 go build -o ../dmr-desktop/src-tauri/binaries/dmr-x86_64-apple-darwin ./cmd/dmr
	@# 打包 macOS 应用
	npm run tauri:build -- --target aarch64-apple-darwin
	npm run tauri:build -- --target x86_64-apple-darwin
	@echo "macOS 打包完成！"
	@echo "输出目录: src-tauri/target/release/bundle/"

package-linux: ## 打包 Linux 版本
	@echo "打包 Linux 版本..."
	@# 构建 Linux DMR 二进制
	@mkdir -p src-tauri/binaries
	cd ../dmr && GOOS=linux GOARCH=amd64 go build -o ../dmr-desktop/src-tauri/binaries/dmr-x86_64-unknown-linux-gnu ./cmd/dmr
	@# 打包 Linux 应用
	npm run tauri:build -- --target x86_64-unknown-linux-gnu
	@echo "Linux 打包完成！"
	@echo "输出目录: src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/"

package-windows: ## 打包 Windows 版本
	@echo "打包 Windows 版本..."
	@# 构建 Windows DMR 二进制
	@mkdir -p src-tauri/binaries
	cd ../dmr && GOOS=windows GOARCH=amd64 go build -o ../dmr-desktop/src-tauri/binaries/dmr-x86_64-pc-windows-msvc.exe ./cmd/dmr
	@# 打包 Windows 应用
	npm run tauri:build -- --target x86_64-pc-windows-msvc
	@echo "Windows 打包完成！"
	@echo "输出目录: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/"

package-all: build-dmr-all ## 打包所有平台（需要配置交叉编译环境）
	@echo "打包所有平台..."
	@# macOS
	@if [ "$$(uname -s)" = "Darwin" ]; then \
		echo "打包 macOS..."; \
		npm run tauri:build -- --target aarch64-apple-darwin || true; \
		npm run tauri:build -- --target x86_64-apple-darwin || true; \
	fi
	@# Linux
	@echo "打包 Linux..."
	npm run tauri:build -- --target x86_64-unknown-linux-gnu || true
	@# Windows
	@echo "打包 Windows..."
	npm run tauri:build -- --target x86_64-pc-windows-msvc || true
	@echo "所有平台打包完成！"
	@echo "输出目录: src-tauri/target/*/release/bundle/"

package: package-mac ## 打包当前平台（默认 macOS）

clean: ## 清理构建产物
	rm -rf dist
	rm -rf src-tauri/target
	rm -rf src-tauri/binaries
	rm -rf node_modules
