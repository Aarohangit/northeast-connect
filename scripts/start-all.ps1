<#
  Starts the whole Flood Response stack: 4 services + 2 apps.
  Each process runs in the background; output goes to logs\<name>.log.

    powershell -ExecutionPolicy Bypass -File scripts\start-all.ps1

  Stop everything with scripts\stop-all.ps1.
#>
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$logs = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logs | Out-Null

# Networks that inspect HTTPS (campus Wi-Fi, some antivirus) break Maven downloads otherwise.
$env:MAVEN_OPTS = '-Djavax.net.ssl.trustStoreType=Windows-ROOT'

function Test-Port([int]$port) {
    [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

function Test-Url([string]$url) {
    try { (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2).StatusCode -lt 500 } catch { $false }
}

Write-Host ''
Write-Host 'Flood Response - starting' -ForegroundColor Cyan
Write-Host ''

# ---- prerequisites --------------------------------------------------------
$mysqlService = Get-Service -Name 'MySQL*' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $mysqlService -or $mysqlService.Status -ne 'Running') {
    throw 'MySQL is not running. Start the MySQL80 service (services.msc) and try again.'
}
Write-Host "  [ok] MySQL ($($mysqlService.Name)) is running"

$venvPython = Join-Path $root 'services\ai-service\.venv\Scripts\python.exe'
if (-not (Test-Path $venvPython)) {
    Write-Host '  [..] Creating Python environment for ai-service (first run only)'
    Push-Location (Join-Path $root 'services\ai-service')
    python -m venv .venv
    & $venvPython -m pip install -q -r requirements.txt
    Pop-Location
}
Write-Host '  [ok] ai-service Python environment'

foreach ($app in 'citizen-app', 'admin-console') {
    $dir = Join-Path $root $app
    if (-not (Test-Path (Join-Path $dir 'node_modules'))) {
        Write-Host "  [..] npm install in $app (first run only)"
        Push-Location $dir; npm install --no-fund --no-audit | Out-Null; Pop-Location
    }
    Write-Host "  [..] Building $app"
    # Through cmd so npm's stderr warnings land in the log instead of tripping PowerShell 5.1.
    $buildLog = Join-Path $logs "$app-build.log"
    Push-Location $dir; cmd /c "npm run build > `"$buildLog`" 2>&1"; $code = $LASTEXITCODE; Pop-Location
    if ($code -ne 0) { throw "Build of $app failed; see logs\$app-build.log" }
}
Write-Host '  [ok] Apps built'
Write-Host ''

# ---- launch ----------------------------------------------------------------
# Full paths, not 'mvnw.cmd': some shells don't search the current folder for programs.
function Get-Mvnw([string]$dir) { '/s /c ""' + (Join-Path $root "$dir\mvnw.cmd") + '" -q spring-boot:run"' }

# Order matters a little: the gateway and rescue-service call the others.
$stack = @(
    @{ Name = 'sos-service';    Port = 8081; Dir = 'services\sos-service';    Exe = 'cmd.exe'; Args = (Get-Mvnw 'services\sos-service');                        Health = 'http://127.0.0.1:8081/actuator/health' },
    @{ Name = 'ai-service';     Port = 8083; Dir = 'services\ai-service';     Exe = $venvPython; Args = '-m uvicorn app.main:app --port 8083 --http h11';                Health = 'http://127.0.0.1:8083/actuator/health' },
    @{ Name = 'rescue-service'; Port = 8082; Dir = 'services\rescue-service'; Exe = 'cmd.exe'; Args = (Get-Mvnw 'services\rescue-service');                        Health = 'http://127.0.0.1:8082/actuator/health' },
    @{ Name = 'api-gateway';    Port = 8090; Dir = 'services\api-gateway';    Exe = 'cmd.exe'; Args = (Get-Mvnw 'services\api-gateway');                        Health = 'http://127.0.0.1:8090/actuator/health' },
    @{ Name = 'citizen-app';    Port = 5173; Dir = 'citizen-app';             Exe = 'cmd.exe'; Args = '/c npx vite preview --port 5173 --strictPort';          Health = 'http://localhost:5173/' },
    @{ Name = 'admin-console';  Port = 5174; Dir = 'admin-console';           Exe = 'cmd.exe'; Args = '/c npx vite preview --port 5174 --strictPort';          Health = 'http://localhost:5174/' }
)

foreach ($s in $stack) {
    if (Test-Port $s.Port) {
        Write-Host ("  [--] {0,-15} port {1} already in use, skipping" -f $s.Name, $s.Port) -ForegroundColor Yellow
        continue
    }
    $out = Join-Path $logs "$($s.Name).log"
    $err = Join-Path $logs "$($s.Name).err.log"
    Start-Process -FilePath $s.Exe -ArgumentList $s.Args -WorkingDirectory (Join-Path $root $s.Dir) `
        -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden | Out-Null
    Write-Host ("  [..] {0,-15} starting on port {1}" -f $s.Name, $s.Port)
}

# ---- wait for health -------------------------------------------------------
Write-Host ''
Write-Host '  Waiting for everything to come up (first start can take a minute)...'
$deadline = (Get-Date).AddMinutes(4)
$pending = [System.Collections.ArrayList]@($stack)
while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
    foreach ($s in @($pending)) {
        if (Test-Url $s.Health) {
            Write-Host ("  [ok] {0,-15} http://localhost:{1}" -f $s.Name, $s.Port) -ForegroundColor Green
            $pending.Remove($s) | Out-Null
        }
    }
    if ($pending.Count -gt 0) { Start-Sleep -Seconds 2 }
}

Write-Host ''
if ($pending.Count -gt 0) {
    foreach ($s in $pending) {
        Write-Host ("  [!!] {0,-15} did not start; see logs\{0}.log and logs\{0}.err.log" -f $s.Name) -ForegroundColor Red
    }
    exit 1
}

Write-Host '  All up.' -ForegroundColor Green
Write-Host ''
Write-Host '  Citizen app    http://localhost:5173'
Write-Host '  Control room   http://localhost:5174   (admin / Flood@2026)'
Write-Host '  API gateway    http://localhost:8090'
Write-Host ''
Write-Host '  Fresh demo data:  scripts\reset-demo.ps1'
Write-Host '  Stop everything:  scripts\stop-all.ps1'
Write-Host ''
