FROM node:18-alpine

WORKDIR /app

# Install AWS CLI, Terraform and required tools
RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    unzip \
    bash \
    gnupg \
    aws-cli \
    && TERRAFORM_VERSION=1.9.8 \
    && curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" -o /tmp/terraform.zip \
    && unzip -q /tmp/terraform.zip -d /usr/local/bin \
    && rm /tmp/terraform.zip \
    && terraform version \
    && aws --version

# Copy dependency graphs first to leverage Docker caching
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Ensure the app runs as a non-root user for security
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Start the Express and Socket.io server
CMD ["node", "server.js"]
