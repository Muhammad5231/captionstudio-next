#!/usr/bin/env python3
"""
CaptionStudio Environment Checker
Verifies local presence of Node.js, pnpm/npm, Python, pip, FFmpeg, FFprobe, and Git.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

# Enable UTF-8 for console output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Safe markers
PASS_MARK = "[PASS]"
FAIL_MARK = "[FAIL]"



def run_cmd(cmd_list):
    """Run command and return (success, version_or_output)."""
    try:
        resolved_cmd = list(cmd_list)
        prog = shutil.which(resolved_cmd[0])
        if prog:
            resolved_cmd[0] = prog
        proc = subprocess.run(
            resolved_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=(sys.platform == "win32"),
            timeout=10,
        )
        if proc.returncode == 0:
            out = proc.stdout.strip() or proc.stderr.strip()
            first_line = out.split("\n")[0] if out else "OK"
            return True, first_line
        return False, proc.stderr.strip() or f"Exit code {proc.returncode}"
    except Exception as e:
        return False, str(e)


def find_binary(name: str):
    """Check current directory, parent directories, or system PATH."""
    cwd = Path.cwd()
    # Check local workspace root
    local_candidates = [
        cwd / f"{name}.exe",
        cwd / name,
        cwd.parent / f"{name}.exe",
        cwd.parent / name,
    ]
    for cand in local_candidates:
        if cand.is_file():
            return str(cand)
    # Check system PATH
    found = shutil.which(name)
    return found


def check_environment():
    print("\n====================================================")
    print("           CaptionStudio Environment Check          ")
    print("====================================================\n")

    checks = []

    # 1. Node.js
    ok, val = run_cmd(["node", "-v"])
    checks.append(("Node.js", ok, val, "Install Node.js (v18+) from https://nodejs.org/"))

    # 2. Package Manager (pnpm or npm)
    pnpm_ok, pnpm_val = run_cmd(["pnpm", "-v"])
    if pnpm_ok:
        checks.append(("Package Mgr", True, f"pnpm {pnpm_val}", ""))
    else:
        npm_ok, npm_val = run_cmd(["npm", "-v"])
        if npm_ok:
            checks.append(("Package Mgr", True, f"npm {npm_val}", "Consider installing pnpm via 'npm i -g pnpm'"))
        else:
            checks.append(("Package Mgr", False, "Missing", "Install npm or pnpm (npm install -g pnpm)"))

    # 3. Python
    py_ok, py_val = run_cmd([sys.executable, "--version"])
    checks.append(("Python", py_ok, py_val, "Install Python 3.11+ from https://www.python.org/"))

    # 4. Pip
    pip_ok, pip_val = run_cmd([sys.executable, "-m", "pip", "--version"])
    short_pip = pip_val.split(" from ")[0] if " from " in pip_val else pip_val
    checks.append(("pip", pip_ok, short_pip, "Install pip using 'python -m ensurepip'"))

    # 5. FFmpeg
    ffmpeg_bin = find_binary("ffmpeg")
    if ffmpeg_bin:
        ok, val = run_cmd([ffmpeg_bin, "-version"])
        ver = val.split(" Copyright ")[0] if " Copyright " in val else "Installed"
        checks.append(("FFmpeg", True, f"{ver} ({Path(ffmpeg_bin).name})", ""))
    else:
        checks.append(("FFmpeg", False, "Not found", "Place ffmpeg.exe in project root or add to PATH"))

    # 6. FFprobe
    ffprobe_bin = find_binary("ffprobe")
    if ffprobe_bin:
        ok, val = run_cmd([ffprobe_bin, "-version"])
        ver = val.split(" Copyright ")[0] if " Copyright " in val else "Installed"
        checks.append(("FFprobe", True, f"{ver} ({Path(ffprobe_bin).name})", ""))
    else:
        checks.append(("FFprobe", False, "Not found", "Place ffprobe.exe in project root or add to PATH"))

    # 7. Git
    git_ok, git_val = run_cmd(["git", "--version"])
    checks.append(("Git", git_ok, git_val, "Install Git from https://git-scm.com/"))

    # Display results
    all_passed = True
    print(f"{'Component':<16} {'Status':<10} {'Details'}")
    print(f"{'-'*16} {'-'*10} {'-'*45}")

    for name, status, details, hint in checks:
        if status:
            sym = PASS_MARK
            print(f"{name:<16} {sym:<10} {details}")
        else:
            all_passed = False
            sym = FAIL_MARK
            print(f"{name:<16} {sym:<10} {details}")
            if hint:
                print(f"                 ↳ Tip: {hint}")

    print(f"\n----------------------------------------------------")
    if all_passed:
        print(f"[SUCCESS] All dependencies verified! System ready for CaptionStudio.\n")
        return 0
    else:
        print(f"[WARNING] Some required dependencies are missing. Check instructions above.\n")
        return 1


if __name__ == "__main__":
    sys.exit(check_environment())
