# 清理旧的 release 目录
if (Test-Path release) {
  Remove-Item -Recurse -Force release
}

npm run build:all          # 前端 + electron 编译
npx electron-builder --win  # 打包
