# 将 origin 配置为标准 HTTPS 地址（不含 token）。
# 认证统一交给 Git Credential Manager（credential.helper = manager），
# 不再把 Personal Access Token 明文写入 remote URL 或本地文件。
git remote set-url origin "https://github.com/mingyue91/ming91.git"
Write-Host "Git remote configured with token-free HTTPS. Authentication is handled by Git Credential Manager."
