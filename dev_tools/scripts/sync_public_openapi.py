"""Generate or verify the committed public OpenAPI artifact for Solas Trace.

  python scripts/sync_public_openapi.py            # write the artifact
  python scripts/sync_public_openapi.py --check    # exit 1 if it drifts
  python scripts/sync_public_openapi.py <path>     # write to a custom path

Since Solas Trace is powered by a high-performance Rust/Axum backend, this script
interacts directly with the running engine's OpenAPI schema endpoint, rather than
importing application code locally like legacy Python monoliths do.
"""

import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTIFACT = ROOT / "backend" / "openapi" / "public.json"
BACKEND_URL = "http://localhost:8080/api/openapi.json"

def fetch_schema_from_engine() -> str:
    """Fetch the OpenAPI schema from the running Rust Solas Trace engine."""
    try:
        req = urllib.request.Request(BACKEND_URL)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return json.dumps(data, indent=2) + "\n"
    except urllib.error.URLError:
        print(f"❌ Error: Could not connect to Solas Trace engine at {BACKEND_URL}", file=sys.stderr)
        print("Please ensure the Rust backend is running (`cargo run`) before syncing the schema.", file=sys.stderr)
        sys.exit(1)

def main(argv: list[str]) -> int:
    check = "--check" in argv
    positional = [a for a in argv if not a.startswith("-")]
    
    print("🔄 Fetching latest OpenAPI schema from Solas Trace Engine...", file=sys.stderr)
    rendered = fetch_schema_from_engine()

    if check:
        if not ARTIFACT.exists():
            print(f"❌ Missing public OpenAPI artifact: {ARTIFACT}", file=sys.stderr)
            return 1
        if ARTIFACT.read_text(encoding="utf-8") != rendered:
            print(
                "❌ Public OpenAPI artifact is stale. Regenerate with:\n"
                "   python scripts/sync_public_openapi.py",
                file=sys.stderr,
            )
            return 1
        print("✅ Public OpenAPI artifact is up to date.", file=sys.stderr)
        return 0

    out = Path(positional[0]) if positional else ARTIFACT
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(rendered, encoding="utf-8")
    
    # Calculate paths for output message
    schema_dict = json.loads(rendered)
    path_count = len(schema_dict.get('paths', {}))
    
    print(f"✅ Wrote {path_count} public paths to {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
