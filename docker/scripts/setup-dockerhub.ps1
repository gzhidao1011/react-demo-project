# ==================== Docker Hub Configuration Script ====================
# Configure Docker Hub credentials as environment variables
#
# After running this script, publish.ps1 will automatically use the configured credentials
#
# Note: This script saves sensitive information to user environment variables
# =========================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Docker Hub Account Configuration" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get user input
$username = Read-Host "Enter your Docker Hub username"

Write-Host ""
Write-Host "Enter your Docker Hub Access Token" -ForegroundColor Yellow
Write-Host "(Create one at https://hub.docker.com/settings/security)" -ForegroundColor Gray
$token = Read-Host "Token" -AsSecureString

# Convert SecureString to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
$tokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variables (user level, permanent)
[System.Environment]::SetEnvironmentVariable("DOCKERHUB_USERNAME", $username, "User")
[System.Environment]::SetEnvironmentVariable("DOCKERHUB_TOKEN", $tokenPlain, "User")

# Also set for current session
$env:DOCKERHUB_USERNAME = $username
$env:DOCKERHUB_TOKEN = $tokenPlain

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Environment variables set:" -ForegroundColor Cyan
Write-Host "  DOCKERHUB_USERNAME = $username" -ForegroundColor White
Write-Host "  DOCKERHUB_TOKEN = ****" -ForegroundColor White
Write-Host ""
Write-Host "You can now publish images with:" -ForegroundColor Yellow
Write-Host "  .\publish.ps1 -Build -Push" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: Restart terminal for changes to take effect in new sessions" -ForegroundColor Gray

# Test login
Write-Host ""
$testLogin = Read-Host "Test Docker Hub login now? (y/n)"
if ($testLogin -eq "y") {
    Write-Host "Testing login..." -ForegroundColor Yellow
    $tokenPlain | docker login -u $username --password-stdin
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Login successful!" -ForegroundColor Green
    } else {
        Write-Host "Login failed. Please check username and token." -ForegroundColor Red
    }
}
