variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "Target AWS Region"
}

variable "container_image" {
  type        = string
  default     = "solas-trace"
  description = "Solas Trace docker image repository name"
}
