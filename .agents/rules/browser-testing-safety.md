# Browser Testing & Lifecycle Safety Rules

**MANDATORY SYSTEM RULE**: Never leave hanging, orphaned, or background browser processes running.

## 1. Zero Zombie Browsers
- Tests and automated verification MUST prioritize fast, zero-dependency unit tests (`npm test` via Node test runner) and build verification (`npm run build`).
- Do NOT spawn background browser windows or headless Chrome processes unless strictly instructed or unavoidable.

## 2. Strict Teardown Guarantees
- If any script, subagent, or test tool launches a browser or connects via CDP:
  1. The execution MUST be wrapped inside a `try ... finally` block.
  2. In the `finally` block, all targets and browser instances MUST be explicitly closed (`browser.close()`, `client.close()`, or process termination).
  3. Never detach processes across the WSL/Windows boundary without tracking their PID and terminating them upon exit.
  4. Execute `npm run cleanup:browsers` (or `bash scripts/cleanup-browsers.sh`) immediately after any browser-based task to ensure 0 orphaned processes remain.

## 3. Verification Command
- Run `npm run cleanup:browsers` to verify and purge any lingering headless processes in both WSL and the Windows host without affecting user sessions.

## 4. WSL vs Windows Browser / Playwright Rule
- **WSL cannot use Playwright**: WSL lacks the Linux GUI, display server, and graphic library dependencies required for Playwright/Chromium execution.
- **Run browser testing strictly in Windows (outside WSL)**:
  - When browser automation, page rendering checks, or visual screenshots are required, run them via Windows host binaries:
    - Windows-native Chrome: `"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"`
    - Windows Node / Playwright: `"/mnt/c/Program Files/nodejs/node.exe"`
  - **Redirect stdin**: Always append `< /dev/null` to Windows `.exe` calls from WSL to prevent terminal/pipe hanging.
  - Example headless Chrome screenshot command:
    ```bash
    "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
      --headless=new --disable-gpu --window-size=1440,900 \
      --screenshot="C:\Users\Saiteja\AppData\Local\Temp\screenshot.png" \
      "http://localhost:5173/?..." < /dev/null
    ```
  - Always execute `npm run cleanup:browsers` afterwards.
