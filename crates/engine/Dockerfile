# 1. Builder Stage
FROM rust:1.75-slim-bookworm AS builder

WORKDIR /usr/src/app

# Install system dependencies needed for compiling sqlite/sqlx
RUN apt-get update && apt-get install -y pkg-config libssl-dev libsqlite3-dev && rm -rf /var/lib/apt/lists/*

# Copy workspace and backend files
COPY Cargo.toml ./Cargo.toml
COPY backend ./backend

# Build release binary
WORKDIR /usr/src/app/backend
RUN cargo build --release

# 2. Runner Stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y openssl ca-certificates libsqlite3-0 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /usr/src/app/backend/target/release/backend /app/backend

# Create default data directory for SQLite database
RUN mkdir -p /app/data

EXPOSE 8080

CMD ["/app/backend"]
