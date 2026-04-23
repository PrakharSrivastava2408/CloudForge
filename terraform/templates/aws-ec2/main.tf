provider "aws" {
  region = var.region
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Generate random password for the instance
resource "random_password" "ec2_password" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_id" "secret_suffix" {
  byte_length = 4
}

# Create a key pair using the generated password
resource "tls_private_key" "generated" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated" {
  key_name   = "idp-ec2-key-${var.environment}"
  public_key = tls_private_key.generated.public_key_openssh
}

# Store credentials in Secrets Manager
resource "aws_secretsmanager_secret" "ec2_credentials" {
  name                    = "idp-ec2-${var.environment}-credentials-${random_id.secret_suffix.hex}"
  recovery_window_in_days = 7

  tags = {
    Environment = var.environment
    ManagedBy   = "IDP-Orchestrator"
  }
}

resource "aws_secretsmanager_secret_version" "ec2_credentials" {
  secret_id = aws_secretsmanager_secret.ec2_credentials.id
  secret_string = jsonencode({
    username      = "ec2-user"
    password      = random_password.ec2_password.result
    private_key   = tls_private_key.generated.private_key_pem
    instance_type = var.instance_type
  })
}

# Security Group
resource "aws_security_group" "ec2_sg" {
  name        = "idp-ec2-sg-${var.environment}"
  description = "Security group for IDP provisioned EC2 instance"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "IDP-Orchestrator"
  }
}

# EC2 Instance
resource "aws_instance" "idp_instance" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = tolist(data.aws_subnets.default.ids)[0]
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  key_name               = aws_key_pair.generated.key_name

  user_data = <<-EOF
              #!/bin/bash
              echo "ec2-user:${random_password.ec2_password.result}" | chpasswd
              EOF

  tags = {
    Name        = "idp-ec2-${var.environment}"
    Environment = var.environment
    ManagedBy   = "IDP-Orchestrator"
  }
}

# Elastic IP
resource "aws_eip" "idp_eip" {
  instance = aws_instance.idp_instance.id

  tags = {
    Environment = var.environment
    ManagedBy   = "IDP-Orchestrator"
  }
}