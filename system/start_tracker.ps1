# === CONFIG ===
$TrackerDir = Split-Path -Parent $PSScriptRoot 
$LogDir			= "$TrackerDir\content\logs"
$KeepDays		= 7

# === ENSURE LOG DIR EXISTS ===
if (!(Test-Path $LogDir)) {
	New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# === DAILY LOG FILE ===
$LogFile = Join-Path $LogDir ("tracker_{0}.log" -f (Get-Date -Format "yyyy-MM-dd"))

# === CLEAN OLD LOGS ===
Get-ChildItem $LogDir -Filter "tracker_*.log" -File |
Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KeepDays) } |
Remove-Item -Force -ErrorAction SilentlyContinue

# === RUN TRACKER WITH TIMESTAMPED LOGGING ===
# We use 'node tracker.js' and redirect both stdout and stderr to the pipe
node "$TrackerDir\tracker.js" 2>&1 |
ForEach-Object {
	"{0} {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $_
} | Out-File -FilePath $LogFile -Append -Encoding utf8