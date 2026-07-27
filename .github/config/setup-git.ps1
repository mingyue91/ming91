$tokenFile = Join-Path $PSScriptRoot "github_token"
$remoteUrl = "https://github.com/mingyue91/ming91.git"

if (Test-Path $tokenFile) {
    $token = Get-Content $tokenFile -Raw | ForEach-Object { $_.Trim() }
    if ($token) {
        $authUrl = "https://oauth2:$token@github.com/mingyue91/ming91.git"
        git remote set-url origin $authUrl
        Write-Host "Git remote configured with token."
    } else {
        Write-Host "Token file is empty, using public remote."
        git remote set-url origin $remoteUrl
    }
} else {
    Write-Host "Token file not found, using public remote."
    git remote set-url origin $remoteUrl
}
