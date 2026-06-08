import os
import subprocess
import sys


def _ensure_venv():
    """Re-execute with the project venv Python if not already in one."""
    in_venv = hasattr(sys, 'real_prefix') or sys.base_prefix != sys.prefix
    if in_venv:
        return
    base = os.path.dirname(os.path.abspath(__file__))
    if sys.platform == "win32":
        venv_python = os.path.join(base, "venv", "Scripts", "python.exe")
    else:
        venv_python = os.path.join(base, "venv", "bin", "python")
    if not os.path.isfile(venv_python):
        print(
            "ERROR: venv not found at", venv_python,
            "\nRun: python -m venv venv && pip install -r requirements.txt",
        )
        sys.exit(1)
    subprocess.run([venv_python] + sys.argv)
    sys.exit()


_ensure_venv()

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
