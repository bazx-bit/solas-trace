// Tests ensuring the Docker Compose infrastructure setup can be verified programmatically
// in CI/CD without actually spinning up containers if docker is missing.

#[test]
fn test_docker_compose_prod_file_exists() {
    let path = std::path::Path::new("../docker/docker-compose.prod.yml");
    assert!(path.exists(), "Production Docker Compose file must exist in the expected location.");
}
