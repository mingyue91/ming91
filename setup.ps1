# Hugo Blog 一键设置脚本
# 在有网络的环境下运行此脚本

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $RepoRoot

Write-Host "=== 初始化 Git 仓库 ===" -ForegroundColor Cyan
git init

Write-Host "=== 添加 hugo-theme-stack 主题 ===" -ForegroundColor Cyan
if (Test-Path "themes/stack") {
    Remove-Item -Recurse -Force "themes/stack"
}
git submodule add https://github.com/CaiJimmy/hugo-theme-stack.git themes/stack

Write-Host "=== 设置远程仓库 ===" -ForegroundColor Cyan
$repo = Read-Host "请输入 GitHub 仓库地址 (例如 https://github.com/mingyue91/ming91.git)"
git remote add origin $repo

Write-Host "=== 本地预览 ===" -ForegroundColor Cyan
Write-Host "运行以下命令启动本地服务器:" -ForegroundColor Yellow
Write-Host "  hugo server --buildDrafts" -ForegroundColor Green
Write-Host "然后在浏览器打开 http://localhost:1313" -ForegroundColor Green

Write-Host ""
Write-Host "=== 推送到 GitHub ===" -ForegroundColor Cyan
Write-Host "确认无误后运行:" -ForegroundColor Yellow
Write-Host "  git add ." -ForegroundColor Green
Write-Host "  git commit -m '初始化博客'" -ForegroundColor Green
Write-Host "  git push -u origin main" -ForegroundColor Green

Write-Host ""
Write-Host "=== GitHub Pages 设置 ===" -ForegroundColor Cyan
Write-Host "推送后在 GitHub 仓库 Settings > Pages 中:" -ForegroundColor Yellow
Write-Host "  Source 选择 GitHub Actions" -ForegroundColor Green
Write-Host ""

Read-Host "按 Enter 继续"
