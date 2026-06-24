Set WshShell = CreateObject("WScript.Shell")
scriptDir = Left(WScript.ScriptFullName, Len(WScript.ScriptFullName) - Len(WScript.ScriptName))
WshShell.CurrentDirectory = Left(scriptDir, Len(scriptDir) - 8)
' Look for the PID file in the system folder
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -Command ""if (Test-Path 'system\tracker.pid') { $pidToKill = Get-Content 'system\tracker.pid'; Stop-Process -Id $pidToKill -Force; Remove-Item 'system\tracker.pid' }""", 0, False