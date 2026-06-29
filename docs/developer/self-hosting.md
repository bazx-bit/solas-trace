# Self-Hosting Solas Trace

Solas Trace is designed to be ridiculously easy to self-host. Unlike legacy systems that require managing a fleet of microservices, Solas Trace is a single binary.

## Deployment Options

### 1. Docker Compose (Recommended for single-node)
We provide a production-ready `docker-compose.prod.yml` that includes the Rust backend, Nginx frontend, and Prometheus/Grafana for internal metrics.

### 2. Kubernetes / Helm
For high availability, use our official Helm chart located in `deploy/helm/solas-trace`.

```bash
helm install solas-trace ./deploy/helm/solas-trace -n observability --create-namespace
```

### 3. AWS ECS Fargate via Terraform
Provision a scalable cloud environment using our Terraform scripts in `deploy/terraform`.

## Database Management
By default, Solas Trace uses an embedded SQLite database (`data/solas-trace.db`) with WAL mode enabled. For 99% of deployments, this easily handles thousands of traces per second.

For extreme scale, the SQLx implementation can be swapped to PostgreSQL by changing the `DATABASE_URL` and recompiling with the `postgres` feature flag.
