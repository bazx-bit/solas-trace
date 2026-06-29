"""Solas Trace development environment launcher.

Launches the unified Rust backend, Vite frontend, and local infrastructure 
in a tmux session with named windows.

Usage:
    python tmux_tools/launcher.py                # normal mode
    python tmux_tools/launcher.py --autoreload   # auto-reload backend on file changes (cargo watch)
    python tmux_tools/launcher.py --reset        # reset the development environment
    python tmux_tools/launcher.py --prod         # production mode (all services in Docker)
"""

import argparse
import os
import shlex
import shutil
import socket
import subprocess
from pathlib import Path

from tmux_tools import schema

REST_PORT = 8080
FRONTEND_PORT = 3000
ROOT = Path(__file__).resolve().parent.parent
DOCKER_COMPOSE = "docker compose -f docker/docker-compose.prod.yml"

def _run(
    command: str | list[str],
    *,
    check: bool = True,
    capture_output: bool = False,
    cwd: str | Path | None = None,
) -> subprocess.CompletedProcess:
    args = shlex.split(command) if isinstance(command, str) else command
    return subprocess.run(
        args,
        check=check,
        capture_output=capture_output,
        text=True,
        cwd=cwd,
    )

def ensure_env_file():
    """Copy .env.example to .env if it doesn't exist."""
    if not os.path.exists(".env"):
        print("Creating .env from .env.example...")
        shutil.copy(".env.example", ".env")
    else:
        print("Found existing .env file.")

def ensure_infra():
    """Start docker containers if not already running.
    Solas Trace only needs minimal infra (Prometheus/Grafana for local observing) 
    since SQLite is embedded.
    """
    print("Ensuring infrastructure is running (Prometheus, Grafana)...")
    _run(f"{DOCKER_COMPOSE} up -d prometheus grafana")

def ensure_rust_deps():
    """Ensure Cargo dependencies are cached."""
    print("Fetching Rust dependencies...")
    _run(["cargo", "fetch"], cwd="backend")

def ensure_frontend_deps():
    """Install frontend deps if node_modules missing."""
    if not os.path.exists("frontend/node_modules"):
        print("Installing frontend dependencies...")
        _run(["npm", "install"], cwd="frontend")
    else:
        print("Frontend dependencies already installed.")

def run_setup():
    """Run all setup steps."""
    ensure_env_file()
    ensure_infra()
    ensure_rust_deps()
    ensure_frontend_deps()
    print("\nSetup complete. Launching Solas Trace development environment...\n")


def _kill_tmux_session(session_name: str) -> None:
    try:
        _run(
            ["tmux", "-L", "solas", "kill-session", "-t", session_name],
            check=False,
            capture_output=True,
        )
    except FileNotFoundError:
        return

def reset_dev_environment() -> None:
    print("Resetting everything...")
    _kill_tmux_session("solas-trace")
    _run(f"{DOCKER_COMPOSE} down -v")
    print("Done. Run 'python tmux_tools/launcher.py' to start fresh.")

def tool_prerequisites():
    """Check that required CLI tools are installed."""
    return [
        schema.Prerequisite(
            name="docker is installed and running",
            command="docker ps",
            instructions="Install Docker: https://docs.docker.com/get-docker/",
        ),
        schema.Prerequisite(
            name="cargo is installed",
            command="cargo --version",
            instructions="Install Rust/Cargo: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh",
        ),
    ]

def _check_port_available(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        try:
            sock.bind(("127.0.0.1", port))
        except OSError as exc:
            return schema.CheckResult(
                False,
                f"Port {port} is in use or unavailable.\nSystem error: {exc}\n",
            )
    return schema.CheckResult(True, "")

def port_available(port):
    """Check that a port is not in use."""
    return schema.Prerequisite(
        name=f"port {port} is available",
        check_fn=lambda: _check_port_available(port),
        instructions=f"Port {port} is in use. Please kill the process.",
    )

def make_driver(autoreload=False):
    """Full stack: Frontend + Rust API."""
    
    if autoreload:
        rest_command = "cargo watch -x run"
    else:
        rest_command = "cargo run"

    return schema.Driver(
        name="solas-trace",
        on_start=run_setup,
        services=[
            schema.Service(
                title="Frontend SPA",
                command="npm run dev",
                web_urls=[
                    ("Solas Trace UI", f"http://localhost:{FRONTEND_PORT}"),
                ],
            ),
            schema.Service(
                title="Rust Backend Engine",
                command=rest_command,
                web_urls=[
                    ("REST API", f"http://localhost:{REST_PORT}"),
                ],
            ),
            schema.Service(
                title="Prometheus Metrics",
                command=f"{DOCKER_COMPOSE} logs -f --tail=50 prometheus",
                web_urls=[],
            ),
        ],
        prerequisites=(
            tool_prerequisites()
            + [port_available(REST_PORT), port_available(FRONTEND_PORT)]
        ),
    )

def main() -> None:
    parser = argparse.ArgumentParser(description="Launch Solas Trace dev environment")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument(
        "--autoreload",
        action="store_true",
        help="Enable auto-reload for Rust backend using cargo-watch",
    )
    mode.add_argument(
        "--reset",
        action="store_true",
        help="Reset the development environment and exit",
    )
    args = parser.parse_args()

    os.chdir(ROOT)

    if args.reset:
        reset_dev_environment()
        return
        
    driver = make_driver(autoreload=args.autoreload)
    driver.run()

if __name__ == "__main__":
    main()
