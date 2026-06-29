# Solas Trace CLI

The Solas Trace CLI (`solas`) is a blazing-fast, Rust-compiled binary designed to help you manage your observability stack, run local proxy servers, and validate OTLP configurations from the terminal.

## Installation

Since Solas Trace is built in Rust, you can install the CLI directly via Cargo:

```bash
cargo install solas-trace-cli
```

## Core Commands

### `solas proxy start`
Starts the local interception proxy.
```bash
solas proxy start --port 8080 --db data/solas.db
```
This intercepts OpenAI/Anthropic SDK calls and forwards them to the LLM providers while logging spans locally.

### `solas trace view <TRACE_ID>`
Displays a flamegraph-style visualization of a specific trace directly in your terminal.

### `solas db migrate`
Runs the embedded SQLx migrations to ensure your local SQLite database is up to date.
