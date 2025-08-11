# Docker Deployment Guide

This guide explains how to deploy the Personal Finance Tracker application using Docker.

## Quick Start

### 1. Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd finance-tracker

# Copy environment file and configure
cp .env.example .env
nano .env  # Edit with your configuration

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f finance-app
```

The application will be available at `http://localhost:5000`

### 2. Using Docker Only

```bash
# Build the image
docker build -t finance-tracker .

# Run with Supabase
docker run -d \
  --name finance-app \
  -p 5000:5000 \
  -e SUPABASE_URL=your-supabase-url \
  -e SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_KEY=your-service-key \
  -e SESSION_SECRET=your-secret-key \
  -v finance-data:/app/data \
  finance-tracker
```

## Configuration Options

### Database Configuration

Choose one of these database options:

#### Option 1: Supabase (Cloud - Recommended)
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

#### Option 2: External PostgreSQL
```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

#### Option 3: Docker Compose PostgreSQL
The included `postgres` service will automatically provide a database when using `docker-compose up`.

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SUPABASE_URL` | Supabase project URL | If using Supabase | - |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | If using Supabase | - |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | If using Supabase | - |
| `DATABASE_URL` | PostgreSQL connection string | If using external PostgreSQL | - |
| `SESSION_SECRET` | Secret key for sessions | Yes | finance-app-secret-key |
| `NODE_ENV` | Environment mode | No | production |
| `PORT` | Application port | No | 5000 |

## Docker Compose Services

### finance-app
- **Purpose**: Main application server
- **Port**: 5000
- **Volumes**: `finance-data:/app/data` for persistent storage
- **Dependencies**: postgres (if using included database)

### postgres
- **Purpose**: PostgreSQL database (optional)
- **Port**: 5432
- **Volumes**: `postgres-data:/var/lib/postgresql/data`
- **Auto-initialization**: Creates tables using `supabase-setup.sql`

### redis
- **Purpose**: Session storage (optional, for scaling)
- **Port**: 6379
- **Volumes**: `redis-data:/data`

## Production Deployment

### Security Considerations

1. **Change default secrets**:
   ```bash
   # Generate a secure session secret
   openssl rand -base64 32
   ```

2. **Use environment-specific `.env` files**:
   ```bash
   cp .env.example .env.production
   # Edit .env.production with production values
   docker-compose --env-file .env.production up -d
   ```

3. **Enable SSL/TLS** with a reverse proxy like Nginx or Traefik

4. **Regular backups**:
   ```bash
   # Backup PostgreSQL data
   docker-compose exec postgres pg_dump -U finance_user finance_db > backup.sql
   
   # Backup application data
   docker run --rm -v finance_data:/data -v $(pwd):/backup ubuntu tar czf /backup/data-backup.tar.gz -C /data .
   ```

### Scaling

To scale the application:

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  finance-app:
    deploy:
      replicas: 3
    depends_on:
      - postgres
      - redis
```

### Health Checks

The application includes health check endpoints:
- `GET /api/health` - Application health
- `GET /api/initialization/status` - Initialization status

## Development

For development with hot reload:

```bash
# Use the development override
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Database connection**: Verify environment variables
3. **Permissions**: Ensure data directories have correct permissions
4. **Memory issues**: Increase Docker memory limits

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs finance-app
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f finance-app
```

### Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Monitoring

For production monitoring, consider adding:
- Prometheus metrics
- Grafana dashboards  
- Log aggregation (ELK stack)
- Uptime monitoring

## Backup Strategy

1. **Database backups**: Schedule regular PostgreSQL dumps
2. **Application data**: Backup the `/app/data` volume
3. **Configuration**: Keep `.env` files in secure version control