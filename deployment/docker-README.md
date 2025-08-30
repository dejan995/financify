# Docker Deployment Guide

This guide provides comprehensive instructions for deploying the Personal Finance Tracker using Docker and Docker Compose.

## Overview

The application is fully containerized with support for:
- **Development**: Hot reload, debugging, and local development
- **Production**: Optimized builds, SSL/TLS, load balancing, and monitoring
- **Multi-Database**: PostgreSQL, Supabase, and SQLite support
- **Scalability**: Horizontal scaling with load balancer support

## Prerequisites

### System Requirements
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB available space
- **CPU**: 2 cores recommended

### Required Files
- `Dockerfile` - Application container definition
- `docker-compose.yml` - Development orchestration
- `docker-compose.prod.yml` - Production overrides
- `nginx.conf` - Reverse proxy configuration
- `.env` - Environment configuration

## Quick Start

### Development Deployment
```bash
# Clone and navigate to project
git clone <repository-url>
cd finance-tracker

# Start development environment
./deploy.sh dev

# Or manually with docker-compose
docker-compose up -d
```

### Production Deployment
```bash
# Configure production environment
cp .env.example .env.production
# Edit .env.production with your values

# Deploy production stack
./deploy.sh prod

# Or manually with production compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Container Architecture

### Application Stack

```
┌─────────────────┐
│     Nginx       │  ← Reverse Proxy / SSL Termination
│   (Production)  │
└─────────────────┘
         │
┌─────────────────┐
│ Finance Tracker │  ← Node.js Application
│   Application   │
└─────────────────┘
         │
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │      Redis      │  ← Session Store
│   (Optional)    │    │   (Optional)    │
└─────────────────┘    └─────────────────┘
```

### Service Definitions

#### finance-app
```yaml
services:
  finance-app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./:/app
      - /app/node_modules
```

#### postgres (Optional)
```yaml
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=finance_tracker
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

#### nginx (Production)
```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
```

## Environment Configuration

### Development (.env)
```env
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-session-secret-key

# Database Configuration (choose one)
# Supabase (Recommended for cloud)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# PostgreSQL
# DATABASE_URL=postgresql://postgres:password@postgres:5432/finance_tracker

# SQLite (automatic in development)
# No configuration needed
```

### Production (.env.production)
```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-strong-session-secret

# Production Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/fullchain.pem
SSL_KEY_PATH=/etc/ssl/private/privkey.pem

# Domain Configuration
DOMAIN=your-domain.com
```

## Dockerfile Structure

### Multi-Stage Build
```dockerfile
# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production Stage  
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Development Stage
```dockerfile
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]
```

## Docker Compose Configurations

### Development (docker-compose.yml)
```yaml
version: '3.8'
services:
  finance-app:
    build:
      context: .
      target: development
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped

  # Optional PostgreSQL for development
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: finance_tracker
      POSTGRES_USER: postgres  
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_dev_data:
```

### Production (docker-compose.prod.yml)
```yaml
version: '3.8'
services:
  finance-app:
    build:
      context: .
      target: production
    environment:
      - NODE_ENV=production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - finance-app
    restart: always

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

## Deployment Scripts

### Automated Deployment (deploy.sh)
```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}

echo "🚀 Deploying Personal Finance Tracker ($ENVIRONMENT)"

if [ "$ENVIRONMENT" = "dev" ]; then
    echo "📦 Starting development environment..."
    docker-compose up -d --build
    echo "✅ Development environment started on http://localhost:5000"
    
elif [ "$ENVIRONMENT" = "prod" ]; then
    echo "🏭 Starting production environment..."
    
    # Check for production environment file
    if [ ! -f ".env.production" ]; then
        echo "❌ .env.production file not found"
        exit 1
    fi
    
    # Deploy production stack
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build
    
    echo "✅ Production environment deployed"
    echo "🔗 Application available at https://your-domain.com"
    
else
    echo "❌ Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

# Health check
echo "🏥 Running health checks..."
sleep 10
curl -f http://localhost:5000/api/health || echo "⚠️  Health check failed"

echo "🎉 Deployment complete!"
```

## SSL/TLS Configuration

### SSL Certificate Setup
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to project
mkdir -p ./ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*
```

### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/certs/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    
    location / {
        proxy_pass http://finance-app:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Database Integration

### Supabase Configuration
```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_KEY="your-service-key"

# Run with Supabase
docker-compose up -d
```

### PostgreSQL Setup
```yaml
# docker-compose.yml addition
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: finance_tracker
      POSTGRES_USER: financeuser
      POSTGRES_PASSWORD: secure_db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Database Initialization
```sql
-- init.sql
CREATE DATABASE finance_tracker;
CREATE USER financeuser WITH PASSWORD 'secure_db_password';
GRANT ALL PRIVILEGES ON DATABASE finance_tracker TO financeuser;
```

## Monitoring & Logging

### Health Checks
```yaml
# Add to service definition
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### Log Management
```bash
# View application logs
docker-compose logs -f finance-app

# View specific service logs
docker-compose logs nginx

# Log rotation setup
# Add to docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Monitoring Stack
```yaml
# Optional monitoring services
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## Backup & Recovery

### Database Backup
```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U financeuser finance_tracker > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U financeuser finance_tracker < backup.sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U financeuser finance_tracker > "$BACKUP_DIR/finance_tracker_$DATE.sql"
```

### Volume Backup
```bash
# Backup Docker volumes
docker run --rm -v finance_tracker_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore Docker volumes
docker run --rm -v finance_tracker_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## Scaling & Performance

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
services:
  finance-app:
    deploy:
      replicas: 3
    
  nginx:
    volumes:
      - ./nginx.lb.conf:/etc/nginx/nginx.conf
```

### Load Balancer Configuration
```nginx
upstream finance_app {
    server finance-app_1:5000;
    server finance-app_2:5000;
    server finance-app_3:5000;
}

server {
    listen 80;
    location / {
        proxy_pass http://finance_app;
    }
}
```

### Performance Tuning
```dockerfile
# Dockerfile optimizations
FROM node:20-alpine AS production

# Add performance configurations
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NODE_ENV=production

# Use PM2 for production process management
RUN npm install -g pm2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find and kill processes using port 5000
sudo lsof -ti:5000 | xargs sudo kill -9

# Or use different port
PORT=5001 docker-compose up -d
```

#### Database Connection Issues
```bash
# Check database container status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U financeuser -d finance_tracker -c "SELECT version();"
```

#### SSL Certificate Issues
```bash
# Verify certificate files
ls -la ./ssl/
openssl x509 -in ./ssl/fullchain.pem -text -noout

# Test SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### Debug Mode
```yaml
# Enable debug mode
services:
  finance-app:
    environment:
      - DEBUG=*
      - LOG_LEVEL=debug
    volumes:
      - .:/app
    command: npm run dev
```

### Log Analysis
```bash
# Follow all logs
docker-compose logs -f

# Filter logs by service
docker-compose logs finance-app | grep ERROR

# Export logs
docker-compose logs --no-color > application.log
```

## Security Best Practices

### Container Security
```dockerfile
# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### Network Security
```yaml
# Create isolated networks
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

### Secret Management
```bash
# Use Docker secrets in production
echo "strong_session_secret" | docker secret create session_secret -
```

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed and valid
- [ ] Database backups scheduled
- [ ] Health checks enabled
- [ ] Log rotation configured
- [ ] Monitoring setup (optional)
- [ ] Firewall rules configured
- [ ] DNS records pointing to server
- [ ] Load balancer configured (if scaling)
- [ ] Security headers configured in Nginx

## Maintenance

### Regular Tasks
```bash
# Update containers
docker-compose pull
docker-compose up -d

# Clean up unused resources
docker system prune -a

# Monitor disk usage
docker system df

# Backup database (weekly)
./scripts/backup.sh
```

### Updates
```bash
# Rolling update strategy
docker-compose up -d --no-deps finance-app

# Zero-downtime deployment with health checks
./scripts/deploy-rolling.sh
```

## Support

For deployment issues:

1. **Check logs**: `docker-compose logs service-name`
2. **Verify configuration**: Review environment variables and compose files
3. **Test connectivity**: Use `docker-compose exec service-name sh` to debug
4. **Review resources**: Monitor CPU, memory, and disk usage
5. **Consult documentation**: Refer to [README.md](README.md) for general issues

---

**Docker deployment made simple** 🐳

For more information, visit the [main documentation](README.md) or open an issue on GitHub.