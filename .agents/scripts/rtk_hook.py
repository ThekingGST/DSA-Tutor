#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import sys

def get_rtk_path():
    path = shutil.which("rtk")
    if path:
        return path
    default_path = os.path.expanduser("~/.local/bin/rtk")
    if os.path.exists(default_path) and os.access(default_path, os.X_OK):
        return default_path
    return "rtk"

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"decision": "allow"}))
            return

        data = json.loads(raw_input)
        tool_call = data.get("toolCall", {})
        if tool_call.get("name") == "run_command":
            args = tool_call.get("args", {})
            cmd = args.get("CommandLine", "")
            if cmd:
                rtk_bin = get_rtk_path()
                res = subprocess.run(
                    [rtk_bin, "rewrite", cmd],
                    capture_output=True,
                    text=True,
                    timeout=5,
                )
                rewritten = res.stdout.strip()
                if rewritten and rewritten != cmd.strip():
                    print(json.dumps({
                        "decision": "allow",
                        "overwrite": {
                            "CommandLine": rewritten
                        }
                    }))
                    return
    except Exception:
        pass

    print(json.dumps({"decision": "allow"}))

if __name__ == "__main__":
    main()
