# Auto-fix check errors script
# Automatically fix errors and retry up to 10 times when pnpm check has errors

$maxAttempts = 10
$attempt = 0
$hasErrors = $true

Write-Host "Starting code check and auto-fix..." -ForegroundColor Cyan
Write-Host "Max attempts: $maxAttempts" -ForegroundColor Yellow
Write-Host ""

while ($hasErrors -and $attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "========================================" -ForegroundColor Gray
    Write-Host "Attempt $attempt" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Gray
    
    # Run check
    Write-Host "Running pnpm check..." -ForegroundColor Cyan
    $checkResult = pnpm check 2>&1
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "Check passed! No errors found." -ForegroundColor Green
        $hasErrors = $false
        break
    }
    
    Write-Host ""
    Write-Host "Errors found, attempting auto-fix..." -ForegroundColor Red
    
    # Run auto-fix
    Write-Host "Running biome check --write..." -ForegroundColor Cyan
    $fixResult = pnpm biome check --write 2>&1
    $fixExitCode = $LASTEXITCODE
    
    if ($fixExitCode -eq 0) {
        Write-Host "Auto-fix completed" -ForegroundColor Green
    } else {
        Write-Host "Auto-fix completed, but there may still be errors" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # If reached max attempts, show final errors
    if ($attempt -ge $maxAttempts) {
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "Reached max attempts ($maxAttempts)" -ForegroundColor Red
        Write-Host "There are still errors that need manual fixing:" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host $checkResult
        exit $exitCode
    }
}

if (-not $hasErrors) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "All errors fixed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    exit 0
}
