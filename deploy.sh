#!/usr/bin/env bash
#
# AIP 一键发布脚本（服务器侧）
# 在源码目录执行：拉取最新代码 -> 安装依赖 -> 构建 -> 冒烟测试 -> 备份并同步到部署目录
#
# 用法：
#   bash deploy.sh
#   ./deploy.sh            # 需 chmod +x deploy.sh
#   SKIP_SMOKE=1 bash deploy.sh        # 跳过冒烟测试
#
# 说明：
#   - 仓库为公开仓库，git 操作默认免密；若为私有仓库，可传入 token：
#       GITHUB_TOKEN=xxx bash deploy.sh
#   - 部署目录中的 Baota 不可变文件 .user.ini 会被自动保留，不会被删除。

set -euo pipefail

SOURCE_DIR="/www/source/aip-platform"
DEPLOY_DIR="/www/wwwroot/aip"
KEEP_BACKUPS=3            # 仅保留最近 N 份备份
PREVIEW_PORT=4173         # vite preview 端口

# ---------- 前置检查 ----------
for bin in git node npm; do
  command -v "$bin" >/dev/null 2>&1 || { echo "✗ 未检测到 $bin，无法继续。"; exit 1; }
done

cd "$SOURCE_DIR"

# ---------- 1. 拉取代码 ----------
echo "==> [1/5] 拉取最新代码 ($(pwd))"
if [ -n "${GITHUB_TOKEN:-}" ]; then
  git -c "url.https://water45250:${GITHUB_TOKEN}@github.com/.insteadOf=https://github.com/" pull --ff-only
else
  git pull --ff-only
fi

# ---------- 2. 安装依赖 ----------
echo "==> [2/5] 安装依赖"
npm install

# ---------- 3. 构建产物 ----------
echo "==> [3/5] 构建产物 (npm run build)"
npm run build

# ---------- 4. 冒烟测试 (vite preview) ----------
if [ -n "${SKIP_SMOKE:-}" ]; then
  echo "==> [4/5] 冒烟测试：已通过 SKIP_SMOKE 跳过"
else
  echo "==> [4/5] 冒烟测试 (vite preview :${PREVIEW_PORT})"
  npm run preview -- --port "$PREVIEW_PORT" --host 127.0.0.1 >/tmp/aip_preview.log 2>&1 &
  PREVIEW_PID=$!
  # 等待预览服务就绪
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/" >/dev/null 2>&1; then break; fi
    sleep 0.5
  done
  SMOKE_OK=1
  HTML=$(curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/") || SMOKE_OK=0
  # 首页需含 SPA 挂载点
  echo "$HTML" | grep -q 'id="root"' || SMOKE_OK=0
  # 主 JS bundle 需可访问（防止构建产物损坏/为空）
  JS=$(echo "$HTML" | grep -oE 'assets/index-[A-Za-z0-9]+\.js' | head -1)
  if [ -n "$JS" ] && ! curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/$JS" >/dev/null 2>&1; then
    SMOKE_OK=0
  fi
  # 收尾：务必关闭预览进程，避免端口/进程残留
  kill "$PREVIEW_PID" 2>/dev/null || true
  wait "$PREVIEW_PID" 2>/dev/null || true
  if [ "$SMOKE_OK" -ne 1 ]; then
    echo "✗ 冒烟测试失败：预览页面未返回预期内容，终止发布。日志："
    tail -n 20 /tmp/aip_preview.log
    exit 1
  fi
  echo "✓ 冒烟测试通过"
fi

# ---------- 5. 备份 + 同步 ----------
echo "==> [5/5] 备份并同步到 $DEPLOY_DIR"
TS=$(date +%Y%m%d-%H%M%S)
BACKUP="${DEPLOY_DIR}.bak.${TS}"
cp -a "$DEPLOY_DIR" "$BACKUP"

# 清空部署目录旧产物（保留 Baota 不可变文件 .user.ini），避免孤儿 bundle 累积
rm -rf "$DEPLOY_DIR"/* 2>/dev/null || true

# 拷入新构建产物
cp -r dist/* "$DEPLOY_DIR"/

# 仅保留最近 KEEP_BACKUPS 份备份
# shellcheck disable=SC2012
ls -dt "${DEPLOY_DIR}".bak.* 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -rf

echo "✓ 发布完成。当前产物: $(ls "$DEPLOY_DIR"/assets 2>/dev/null | tr '\n' ' ')"
echo "✓ 本次备份: $BACKUP"
