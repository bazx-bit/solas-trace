# Automated PR Creation

Once the Solas Trace AI Agent has performed a Root Cause Analysis (RCA) and identified the buggy code in your repository, it can autonomously generate a fix and submit a Pull Request (PR) to your GitHub repository.

## The PR Workflow

1. **Diagnosis**: The RCA engine isolates the failing Abstract Syntax Tree (AST) node.
2. **Patch Generation**: The BYOK LLM generates a diff to fix the identified issue (e.g., handling a null reference, fixing a prompt template, adjusting a tool schema).
3. **Branching**: The Rust engine uses `git2-rs` to securely create a new branch (`solas-fix/<trace-id>`) from the failing commit.
4. **Commit & Push**: The patch is applied, committed, and pushed back to GitHub using the permissions granted via the GitHub Integration.
5. **PR Creation**: A PR is opened via the GitHub API, containing the trace timeline, the RCA report, and the proposed code fix.

## Security Controls
- PRs are always created in draft mode or require manual review by default.
- Solas Trace will never auto-merge code to your `main` branch.
