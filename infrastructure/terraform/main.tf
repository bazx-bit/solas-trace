provider "aws" {
  region = var.aws_region
}

# 1. VPC Configuration
resource "aws_vpc" "solas_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "solas-trace-vpc"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.solas_vpc.id
}

resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.solas_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.solas_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  map_public_ip_on_launch = true
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.solas_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "pub_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "pub_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# 2. Security Groups
resource "aws_security_group" "ecs_sg" {
  name        = "solas-trace-ecs-sg"
  description = "Allow port 8080 and 80 traffic"
  vpc_id      = aws_vpc.solas_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. ECS Cluster
resource "aws_ecs_cluster" "solas_cluster" {
  name = "solas-trace-cluster"
}

# 4. Fargate Task Definition
resource "aws_ecs_task_definition" "solas_task" {
  family                   = "solas-trace-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = jsonencode([{
    name      = "solas-trace"
    image     = "${var.container_image}:latest"
    essential = true
    portMappings = [{
      containerPort = 8080
      hostPort      = 8080
    }]
    environment = [
      { name = "DATABASE_URL", value = "sqlite:data/solas_trace.db" },
      { name = "PORT", value = "8080" }
    ]
  }])
}

# 5. ECS Fargate Service
resource "aws_ecs_service" "solas_service" {
  name            = "solas-trace-service"
  cluster         = aws_ecs_cluster.solas_cluster.id
  task_definition = aws_ecs_task_definition.solas_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }
}
