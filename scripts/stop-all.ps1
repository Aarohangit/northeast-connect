<#
  Stops every Flood Response process started by start-all.ps1 (or by hand).
  Only processes recognised as ours are stopped, so other software that
  happens to use one of these ports is left alone.
#>
$ports = 8081, 8082, 8083, 8090, 5173, 5174
$ours = 'SosServiceApplication|RescueServiceApplication|ApiGatewayApplication|uvicorn\s+app\.main|vite'

foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $conn) { continue }
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($conn.OwningProcess)"
    if ($proc.CommandLine -match $ours) {
        Stop-Process -Id $proc.ProcessId -Force -Confirm:$false
        Write-Host ("  stopped  port {0}  ({1})" -f $port, $proc.Name)
    } else {
        Write-Host ("  skipped  port {0}  ({1} is not part of Flood Response)" -f $port, $proc.Name) -ForegroundColor Yellow
    }
}
Write-Host '  Done.'
