# --- Guarantee admin privileges ---
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
	Write-Host "Restarting with Administrator privileges..." -ForegroundColor Yellow
	Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
	exit
}

# --- Configuration ---
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$startVbs = Join-Path $baseDir "system\start_tracker.vbs"
$endVbs = Join-Path $baseDir "system\end_tracker.vbs"
$exePath = "*\steamapps\common\Dead by Daylight\DeadByDaylight\Binaries\Win64\DeadByDaylight-Win64-Shipping.exe"

# --- Visual Setup ---
$host.UI.RawUI.BackgroundColor = "Black"
$host.UI.RawUI.ForegroundColor = "Gray"
Clear-Host
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "     DeeBeeDee Match History Tracker - Installer          " -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host "==========================================================" -ForegroundColor Magenta

# Install NPM dependencies
Write-Host "`n[1/6] Installing NPM dependencies..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
	npm install
	Write-Host "      SUCCESS: Dependencies installed." -ForegroundColor Green
} else {
	Write-Host "      ERROR: Node.js/npm not found. Please install Node.js." -ForegroundColor Red
	Pause
	exit
}

# Install Playwright
Write-Host "`n[2/6] Installing Playwright browser binaries..." -ForegroundColor Yellow

$env:PLAYWRIGHT_BROWSERS_PATH = $browserDir
npx playwright install chromium --with-deps

if ($LASTEXITCODE -eq 0) {
	Write-Host "      SUCCESS: Playwright installed." -ForegroundColor Green
} else {
	Write-Host "      ERROR: Playwright installation failed." -ForegroundColor Red
	Pause
	exit
}

# Enable and Verify Auditing
Write-Host "`n[3/6] Configuring Windows Security Auditing..." -ForegroundColor Yellow

function Set-AuditPolicy {
	param([string]$subcat)
	auditpol /set /subcategory:$subcat /success:enable | Out-Null
	
	$result = auditpol /get /subcategory:$subcat /r
	if ($result -match "Success") {
		Write-Host "      SUCCESS: $subcat auditing enabled." -ForegroundColor Green
	} else {
		Write-Host "      ERROR: Failed to enable $subcat auditing. Ensure you are running as Administrator." -ForegroundColor Red
		Pause
		exit
	}
}

Set-AuditPolicy "Process Creation"
Set-AuditPolicy "Process Termination"

# Register Tasks with Verified Path
Write-Host "`n[4/6] Registering Task Scheduler triggers..." -ForegroundColor Yellow

# Read the setting from env.json
$envContent = Get-Content "content/env.json" -Raw | ConvertFrom-Json
$desiredMode = $envContent.i_might_play_more_than_50_matches_in_a_day

# Update the state file to reflect what the user wants
$stateFilePath = Join-Path $baseDir "system\tracker_state.txt"
$desiredMode | Out-File -FilePath $stateFilePath -Encoding ascii -NoNewline

# Decide mode
$isCyclic = $desiredMode -eq $true

# Clean up existing tasks to prevent conflicts
schtasks /delete /tn "DeeBeeDee History Tracker - Launch (Cyclic)" /f 2>$null | Out-Null
schtasks /delete /tn "DeeBeeDee History Tracker - Launch (Single-Run)" /f 2>$null | Out-Null
schtasks /delete /tn "DeeBeeDee History Tracker - Stop" /f 2>$null | Out-Null

# Retrieve steam path and the game's executable
$steamPath = (Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\Valve\Steam" -Name "InstallPath" -ErrorAction SilentlyContinue).InstallPath
if (-not $steamPath) {
	$steamPath = (Get-ItemProperty -Path "HKLM:\SOFTWARE\Valve\Steam" -Name "InstallPath" -ErrorAction SilentlyContinue).InstallPath
}
$dbdExe = Join-Path $steamPath "steamapps\common\Dead by Daylight\DeadByDaylight\Binaries\Win64\DeadByDaylight-Win64-Shipping.exe"

# Setup tasks
function Register-Task-Final {
	param($TaskName, $ScriptPath, $EventID, $DataName, $baseDir, $Interval, $TargetExePath)
	
	$xmlPath = Join-Path $env:TEMP "$TaskName.xml"
	
	$xmlContent = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
<Triggers>
	<EventTrigger>
		<Enabled>true</Enabled>
		<Subscription>&lt;QueryList&gt;&lt;Query Id="0" Path="Security"&gt;&lt;Select Path="Security"&gt;*[System[(EventID=$EventID)]] and *[EventData[Data[@Name='$DataName'] and (Data='$TargetExePath')]]&lt;/Select&gt;&lt;/Query&gt;&lt;/QueryList&gt;</Subscription>
	</EventTrigger>
</Triggers>
<Principals>
	<Principal id="Author">
		<LogonType>InteractiveToken</LogonType>
		<RunLevel>HighestAvailable</RunLevel>
	</Principal>
</Principals>
<Settings>
	<MultipleInstancesPolicy>StopExisting</MultipleInstancesPolicy>
	<DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
	<StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
	<ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
	<RestartOnFailure>
		<Interval>$Interval</Interval>
		<Count>6</Count>
	</RestartOnFailure>
</Settings>
<Actions Context="Author">
	<Exec>
		<Command>wscript.exe</Command>
		<Arguments>//B "$ScriptPath"</Arguments>
		<WorkingDirectory>$baseDir</WorkingDirectory>
	</Exec>
</Actions>
</Task>
"@
	
	$xmlContent | Out-File $xmlPath -Encoding unicode
	schtasks /create /tn "$TaskName" /xml "$xmlPath" /f | Out-Null
	
	if ($LASTEXITCODE -eq 0) {
		Write-Host "      SUCCESS: '$TaskName' registered." -ForegroundColor Green
	} else {
		Write-Host "      ERROR: Failed to register '$TaskName'. Exit code: $LASTEXITCODE" -ForegroundColor Red
		Pause
		exit
	}
}

if ($isCyclic) {
	Write-Host "      Mode: Cyclic (Launch on Start, Stop on Close)" -ForegroundColor Cyan
	Register-Task-Final "DeeBeeDee History Tracker - Launch (Cyclic)" $startVbs 4688 "NewProcessName" $baseDir "PT10M" $dbdExe
	Register-Task-Final "DeeBeeDee History Tracker - Stop" $endVbs 4689 "ProcessName" $baseDir "PT1M" $dbdExe
} else {
	Write-Host "      Mode: Single-Run (Launch on Close)" -ForegroundColor Cyan
	Register-Task-Final "DeeBeeDee History Tracker - Launch (Single-Run)" $startVbs 4689 "ProcessName" $baseDir "PT10M" $dbdExe
}

# Build Tampermonkey Script
Write-Host "`n[5/6] Building Tampermonkey UserScript..." -ForegroundColor Yellow

$buildScriptPath = Join-Path $baseDir "tampermonkey\build.ps1"

if (Test-Path $buildScriptPath) {
	# Execute the build script natively in the current session
	Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$buildScriptPath`"" -Wait -NoNewWindow
} else {
	Write-Host "      ERROR: Could not find build script at $buildScriptPath" -ForegroundColor Red
	Pause
	exit
}

#  Finalize
Write-Host "`n[6/6] Installation Complete!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "Everything is set up. The tracker will run automatically." -ForegroundColor White
Start-Sleep -Seconds 5