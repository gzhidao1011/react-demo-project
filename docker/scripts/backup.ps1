# ==================== Docker Data Backup Script ====================
# Backup MySQL databases and Docker volumes
# ===================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupDir = ".\backups",
    
    [switch]$MySQL,      # Backup MySQL databases
    [switch]$Volumes,    # Backup Docker volumes
    [switch]$All         # Backup everything
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Create backup directory
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$BackupDir = (Resolve-Path $BackupDir).Path

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Docker Data Backup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup directory: $BackupDir" -ForegroundColor Yellow
Write-Host "Timestamp: $Timestamp" -ForegroundColor Yellow
Write-Host ""

# Backup MySQL databases
if ($MySQL -or $All) {
    Write-Host "[1/2] Backing up MySQL databases..." -ForegroundColor Cyan
    
    # Check if MySQL container is running
    $mysqlRunning = docker ps --filter "name=mysql" --format "{{.Names}}"
    if ($mysqlRunning) {
        # Backup all databases
        $sqlFile = "$BackupDir\mysql_all_$Timestamp.sql"
        docker exec mysql mysqldump -uroot -proot123 --all-databases > $sqlFile
        
        if ($LASTEXITCODE -eq 0) {
            $size = (Get-Item $sqlFile).Length / 1KB
            Write-Host "  MySQL backup saved: $sqlFile ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
        } else {
            Write-Host "  MySQL backup failed!" -ForegroundColor Red
        }
        
        # Backup individual databases
        @("user_db", "order_db", "nacos") | ForEach-Object {
            $dbFile = "$BackupDir\mysql_${_}_$Timestamp.sql"
            docker exec mysql mysqldump -uroot -proot123 $_ > $dbFile 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  Database '$_' saved: $dbFile" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  MySQL container is not running. Skipping database backup." -ForegroundColor Yellow
    }
    Write-Host ""
}

# Backup Docker volumes
if ($Volumes -or $All) {
    Write-Host "[2/2] Backing up Docker volumes..." -ForegroundColor Cyan
    
    # Get project volumes
    $volumes = docker volume ls --format "{{.Name}}" | Where-Object { $_ -like "*mysql-data*" -or $_ -like "*nacos-data*" }
    
    foreach ($vol in $volumes) {
        $tarFile = "$BackupDir\${vol}_$Timestamp.tar.gz"
        Write-Host "  Backing up volume: $vol" -ForegroundColor Gray
        
        docker run --rm -v ${vol}:/data -v ${BackupDir}:/backup alpine tar czf /backup/${vol}_$Timestamp.tar.gz -C /data .
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path $tarFile)) {
            $size = (Get-Item $tarFile).Length / 1KB
            Write-Host "  Volume backup saved: $tarFile ($([math]::Round($size, 2)) KB)" -ForegroundColor Green
        } else {
            Write-Host "  Volume backup failed: $vol" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# Summary
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Backup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup files:" -ForegroundColor Cyan
Get-ChildItem $BackupDir -Filter "*$Timestamp*" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor White
}
Write-Host ""
Write-Host "To restore MySQL:" -ForegroundColor Yellow
Write-Host "  docker exec -i mysql mysql -uroot -proot123 < backup_file.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "To restore volume:" -ForegroundColor Yellow
Write-Host "  docker run --rm -v VOLUME_NAME:/data -v `${PWD}:/backup alpine tar xzf /backup/backup_file.tar.gz -C /data" -ForegroundColor Gray
