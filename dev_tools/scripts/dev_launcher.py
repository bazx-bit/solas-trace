import subprocess
import sys
import os
import signal
import time
from threading import Thread

processes = []

def run_process(cmd, cwd, prefix):
    print(f"[{prefix}] Starting command: {' '.join(cmd)} in {cwd}")
    try:
        p = subprocess.Popen(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            shell=True
        )
        processes.append(p)
        
        # Read stream asynchronously to display in developer console
        for line in iter(p.stdout.readline, ''):
            print(f"[{prefix}] {line.strip()}")
            
        p.stdout.close()
        p.wait()
    except Exception as e:
        print(f"[{prefix}] Failed to execute: {e}")

def signal_handler(sig, frame):
    print("\n[Launcher] Shutting down all active servers...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=2)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass
    sys.exit(0)

if __name__ == "__main__":
    # Handle termination signals cleanly on both Unix and Windows
    signal.signal(signal.SIGINT, signal_handler)
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    
    # 1. Start Rust Backend Thread
    backend_cmd = ["cargo", "run"]
    backend_thread = Thread(target=run_process, args=(backend_cmd, backend_dir, "Backend"), daemon=True)
    backend_thread.start()
    
    # Wait a moment for database migrations to initialize before booting frontend
    time.sleep(2)
    
    # 2. Start Frontend SPA Thread
    frontend_cmd = ["npm", "run", "dev"]
    frontend_thread = Thread(target=run_process, args=(frontend_cmd, frontend_dir, "Frontend"), daemon=True)
    frontend_thread.start()
    
    print("\n[Launcher] Press Ctrl+C to terminate both servers concurrently.\n")
    
    # Keep main thread alive
    while True:
        time.sleep(1)
