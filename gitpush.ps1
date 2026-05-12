# gitpush.ps1
# PowerShell helper para agregar, commitear y pushear todos los cambios al repo remoto AXO.

Set-StrictMode -Version Latest

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git add + commit + push (AXO)" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: git no está instalado o no está en PATH." -ForegroundColor Red
    exit 1
}

if (-not (git rev-parse --is-inside-work-tree 2>$null)) {
    Write-Host "No existe repositorio git en esta carpeta. Se inicializará uno nuevo..." -ForegroundColor Yellow
    git init | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo inicializar el repositorio git." -ForegroundColor Red
        exit 1
    }
}

$originUrl = git remote get-url origin 2>$null
if (-not $originUrl) {
    git remote add origin https://github.com/alexxcrz/AXO.git
} else {
    git remote set-url origin https://github.com/alexxcrz/AXO.git
}

$commitMsg = Read-Host 'Escribe el mensaje del commit y presiona Enter'
if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = 'update: cambios AXO'
}

Write-Host "`nCommit: $commitMsg`n"

git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudieron agregar los archivos." -ForegroundColor Red
    exit 1
}

$branch = git branch --show-current 2>$null
if (-not $branch) {
    $branch = 'master'
}

$staged = git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "$commitMsg"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo crear el commit." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No hay cambios nuevos para commitear. Se intentará hacer push del branch actual." -ForegroundColor Yellow
}

git push origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló el push. Verifica autenticación/permisos." -ForegroundColor Red
    exit 1
}

Write-Host "`nPush completado correctamente." -ForegroundColor Green
