output "ecs_cluster_name" {
  value = aws_ecs_cluster.solas_cluster.name
}

output "ecs_service_name" {
  value = aws_ecs_service.solas_service.name
}
