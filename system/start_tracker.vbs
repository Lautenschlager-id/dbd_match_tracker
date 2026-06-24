Set WshShell = CreateObject("WScript.Shell")
' Get the directory of the script itself
scriptDir = Left(WScript.ScriptFullName, Len(WScript.ScriptFullName) - Len(WScript.ScriptName))
' Set the working directory to the parent (project root)
WshShell.CurrentDirectory = Left(scriptDir, Len(scriptDir) - 8)
' Run the ps1 file that is inside the system folder
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File system\start_tracker.ps1", 0, False