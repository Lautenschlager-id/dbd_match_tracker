# --- Configuration ---
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$installDir = (Resolve-Path "$scriptDir\..").Path

$sequencePath = Join-Path $scriptDir "sequence.json"
$srcDir = Join-Path $scriptDir "src"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFileName = "generated_tampermonkey_$timestamp.js"
$outputPath = Join-Path $installDir $outputFileName

# --- Visual Setup ---
$host.UI.RawUI.BackgroundColor = "Black"
$host.UI.RawUI.ForegroundColor = "Gray"
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "   DeeBeeDee Match History Tracker - Script Builder       " -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host "==========================================================" -ForegroundColor Magenta

# 1. Verify Build Configuration
Write-Host "`n[1/3] Verifying build configuration..." -ForegroundColor Yellow

if (Test-Path $sequencePath) {
	$sequenceArray = Get-Content -Raw -Path $sequencePath | ConvertFrom-Json
	Write-Host "      SUCCESS: Loaded sequence.json." -ForegroundColor Green
} else {
	Write-Host "      ERROR: Could not find configuration at $sequencePath." -ForegroundColor Red
	Pause
	exit
}

# 2. Construct Local File URIs
Write-Host "`n[2/3] Constructing local resource URIs..." -ForegroundColor Yellow

$uriPath = $installDir -replace '\\', '/'
$localHistoryPath = "file:///$uriPath/content/history.json?v=1"

if ($localHistoryPath -match "file:///") {
	Write-Host "      SUCCESS: Local URI mapped securely." -ForegroundColor Green
} else {
	Write-Host "      ERROR: Failed to map local URI." -ForegroundColor Red
	Pause
	exit
}

# 3. Compile Script Files
Write-Host "`n[3/3] Compiling Tampermonkey script..." -ForegroundColor Yellow

# Clean up any previously generated Tampermonkey scripts to prevent clutter
$oldFiles = Get-ChildItem -Path $installDir -Filter "generated_tampermonkey_*.js" -ErrorAction SilentlyContinue

if ($oldFiles) {
	Remove-Item -Path $oldFiles.FullName -Force
	Write-Host "      SUCCESS: Cleaned up old generated scripts." -ForegroundColor Green
}

foreach ($fileName in $sequenceArray) {
	$filePath = Join-Path $srcDir $fileName
	
	if (Test-Path $filePath) {
		$content = Get-Content -Raw -Path $filePath
		
		# Inject the dynamically generated path into the metadata file
		if ($fileName -eq "meta.js") {
			$content = $content -replace '\{\{LOCAL_HISTORY_PATH\}\}', $localHistoryPath
		}

		# Append to the final output file
		Add-Content -Path $outputPath -Value "`n// --- Source: $fileName ---"
		Add-Content -Path $outputPath -Value $content.Trim()
		
		Write-Host "      SUCCESS: Appended $fileName" -ForegroundColor Green
	} else {
		Write-Host "      ERROR: Source file missing: $filePath" -ForegroundColor Red
		Pause
		exit
	}
}

# 4. Finalize
Write-Host "`n==========================================================" -ForegroundColor Magenta
Write-Host "Build Complete!" -ForegroundColor Cyan
Write-Host "The user script has been successfully generated at:" -ForegroundColor White
Write-Host "$outputPath" -ForegroundColor Gray
Start-Sleep -Seconds 3