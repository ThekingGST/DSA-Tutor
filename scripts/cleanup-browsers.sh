#!/usr/bin/env bash
set -e

# 1. Kill any browser / devtools processes in WSL
echo "[cleanup-browsers] Terminating WSL browser & devtools processes..."
pkill -9 -f chrome-devtools-mcp 2>/dev/null || true
pkill -9 -f "chrome.*--headless" 2>/dev/null || true
pkill -9 -f "chromium.*--headless" 2>/dev/null || true

# 2. Terminate orphaned headless Chrome processes on the Windows host
if command -v powershell.exe &>/dev/null; then
  echo "[cleanup-browsers] Checking and cleaning host Windows headless Chrome processes..."
  powershell.exe -NoProfile -NonInteractive -Command "
    Get-CimInstance Win32_Process | Where-Object {
      \$_.Name -eq 'chrome.exe' -and \$_.CommandLine -like '*headless*'
    } | ForEach-Object {
      Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue
      Write-Output \"Terminated headless host chrome.exe PID \$(\$_.ProcessId)\"
    }
  " 2>/dev/null || true
fi

echo "[cleanup-browsers] Browser cleanup complete. No orphaned headless processes remaining."
