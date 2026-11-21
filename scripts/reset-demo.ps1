<#
  Wipes all SOS requests and operations, puts every rescue team back on
  AVAILABLE, and loads the demo scenario. Team records themselves are kept.

    powershell -ExecutionPolicy Bypass -File scripts\reset-demo.ps1
    powershell -ExecutionPolicy Bypass -File scripts\reset-demo.ps1 -NoSeed   # wipe only

  The services must be running (scripts\start-all.ps1) for the seed step.
#>
param([switch]$NoSeed)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent

$mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
if (-not (Test-Path $mysql)) {
    $cmd = Get-Command mysql -ErrorAction SilentlyContinue
    if (-not $cmd) { throw 'mysql client not found. Add MySQL bin to PATH.' }
    $mysql = $cmd.Source
}

$user = if ($env:DB_USER) { $env:DB_USER } else { 'flood' }
$env:MYSQL_PWD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { 'floodpass' }

$sql = @'
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE sos_db.sos_triage;
TRUNCATE TABLE sos_db.sos_status_history;
TRUNCATE TABLE sos_db.sos_requests;
TRUNCATE TABLE rescue_db.rescue_assignments;
UPDATE rescue_db.rescue_teams SET status = 'AVAILABLE';
SET FOREIGN_KEY_CHECKS = 1;
'@

Write-Host '  Clearing SOS requests and operations...'
$ErrorActionPreference = 'Continue'   # mysql may print warnings on stderr; the exit code decides
$sql | & $mysql -u $user --host=127.0.0.1 --port=3306
$code = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($code -ne 0) { throw 'Database reset failed.' }
Write-Host '  [ok] Database cleared, all teams available' -ForegroundColor Green

if ($NoSeed) { return }

try {
    Invoke-WebRequest -Uri 'http://localhost:8090/actuator/health' -UseBasicParsing -TimeoutSec 3 | Out-Null
} catch {
    throw 'Services are not running, so demo data was not loaded. Run scripts\start-all.ps1, then this again.'
}

Write-Host '  Loading demo scenario...'
$ErrorActionPreference = 'Continue'
python (Join-Path $root 'infra\seed\seed_demo.py')
$code = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($code -ne 0) { throw 'Seeding failed.' }
Write-Host '  [ok] Demo data ready. Refresh the control room.' -ForegroundColor Green
