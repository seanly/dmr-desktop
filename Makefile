.PHONY: help install dev build clean setup

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
	@echo "构建 DMR sidecar..."
	@$(MAKE) sidecar-local
	@echo "依赖安装完成!"

dev: ## 启动开发模式
	npm run tauri:dev

build: ## 构建生产版本
	npm run tauri:build

clean: ## 清理构建产物
	rm -rf dist
	rm -rf src-tauri/target
	rm -rf node_modules
	rm -f src-tauri/binaries/dmr*

sidecar: ## 构建 DMR sidecar (所有平台)
	@echo "构建 macOS ARM64..."
	cd sidecar && GOOS=darwin GOARCH=arm64 go build -o ../src-tauri/binaries/dmr-aarch64-apple-darwin .
	@echo "构建 macOS x86_64..."
	cd sidecar && GOOS=darwin GOARCH=amd64 go build -o ../src-tauri/binaries/dmr-x86_64-apple-darwin .
	@echo "构建 Linux x86_64..."
	cd sidecar && GOOS=linux GOARCH=amd64 go build -o ../src-tauri/binaries/dmr-x86_64-unknown-linux-gnu .
	@echo "构建 Windows x86_64..."
	cd sidecar && GOOS=windows GOARCH=amd64 go build -o ../src-tauri/binaries/dmr-x86_64-pc-windows-msvc.exe .
	@echo "所有平台 sidecar 构建完成!"

sidecar-local: ## 构建当前平台的 DMR sidecar
	@echo "构建当前平台 sidecar..."
	@mkdir -p src-tauri/binaries
	cd sidecar && go build -o ../src-tauri/binaries/dmr .
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
	@echo "Sidecar 构建完成!"
