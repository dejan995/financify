#!/bin/bash

# Personal Finance Tracker - Docker Deployment Script
# This script helps deploy the application using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate secure session secret
generate_session_secret() {
    if command_exists openssl; then
        openssl rand -base64 32
    elif command_exists python3; then
        python3 -c "import secrets; print(secrets.token_urlsafe(32))"
    else
        echo "finance-app-$(date +%s)-$(shuf -i 1000-9999 -n 1)"
    fi
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Setup environment file
setup_environment() {
    print_header "Setting up Environment"
    
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp ./.env.example .env
        
        # Generate session secret
        SESSION_SECRET=$(generate_session_secret)
        sed -i "s/your-super-secret-session-key-change-this-in-production/$SESSION_SECRET/" .env
        
        print_warning "Please edit .env file with your database configuration:"
        print_warning "  - For Supabase: Add SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY"
        print_warning "  - For PostgreSQL: Add DATABASE_URL"
        print_warning ""
        
        read -p "Press Enter to continue after configuring .env file..."
    else
        print_status "Environment file already exists"
    fi
}

# Build and start services
deploy_application() {
    local mode=${1:-production}
    
    print_header "Deploying Application ($mode mode)"
    
    if [ "$mode" = "development" ]; then
        print_status "Starting in development mode with hot reload..."
        docker-compose -f deployment/docker-compose.yml -f deployment/docker-compose.override.yml up --build -d
    elif [ "$mode" = "production" ]; then
        print_status "Starting in production mode..."
        docker-compose -f deployment/docker-compose.yml -f deployment/docker-compose.prod.yml up --build -d
    else
        print_status "Starting in default mode..."
        docker-compose -f deployment/docker-compose.yml up --build -d
    fi
}

# Show application status
show_status() {
    print_header "Application Status"
    docker-compose -f deployment/docker-compose.yml ps
    
    print_status ""
    print_status "Application URLs:"
    print_status "  - Main App: http://localhost:5000"
    print_status "  - Database: localhost:5432 (if using included PostgreSQL)"
    print_status "  - Redis: localhost:6379 (if using included Redis)"
    
    print_status ""
    print_status "Useful commands:"
    print_status "  - View logs: docker-compose -f deployment/docker-compose.yml logs -f finance-app"
    print_status "  - Stop services: docker-compose -f deployment/docker-compose.yml down"
    print_status "  - Restart: docker-compose -f deployment/docker-compose.yml restart finance-app"
    print_status "  - View all logs: docker-compose -f deployment/docker-compose.yml logs"
}

# Backup function
backup_data() {
    print_header "Creating Backup"
    
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup PostgreSQL if running
    if docker-compose -f deployment/docker-compose.yml ps postgres | grep -q "Up"; then
        print_status "Backing up PostgreSQL database..."
        docker-compose -f deployment/docker-compose.yml exec -T postgres pg_dump -U finance_user finance_db > "$backup_dir/database.sql"
    fi
    
    # Backup application data
    print_status "Backing up application data..."
    docker run --rm -v finance-app_finance-data:/data -v "$(pwd)/$backup_dir":/backup ubuntu tar czf /backup/app-data.tar.gz -C /data .
    
    print_status "Backup completed: $backup_dir"
}

# Clean up function
cleanup() {
    print_header "Cleaning Up"
    
    print_warning "This will stop all containers and remove volumes (DATA WILL BE LOST)"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f deployment/docker-compose.yml down -v --remove-orphans
        docker system prune -f
        print_status "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Update application
update_application() {
    print_header "Updating Application"
    
    print_status "Pulling latest code..."
    git pull origin main 2>/dev/null || print_warning "Git pull failed or not a git repository"
    
    print_status "Rebuilding and restarting containers..."
    docker-compose -f deployment/docker-compose.yml down
    docker-compose -f deployment/docker-compose.yml build --no-cache
    docker-compose -f deployment/docker-compose.yml up -d
    
    print_status "Update completed"
}

# Main script
main() {
    print_header "Personal Finance Tracker - Docker Deployment"
    
    case "${1:-help}" in
        "dev"|"development")
            check_prerequisites
            setup_environment
            deploy_application "development"
            show_status
            ;;
        "prod"|"production")
            check_prerequisites
            setup_environment
            deploy_application "production"
            show_status
            ;;
        "start"|"up")
            check_prerequisites
            deploy_application
            show_status
            ;;
        "stop"|"down")
            docker-compose -f deployment/docker-compose.yml down
            print_status "Application stopped"
            ;;
        "restart")
            docker-compose -f deployment/docker-compose.yml restart
            show_status
            ;;
        "logs")
            docker-compose -f deployment/docker-compose.yml logs -f finance-app
            ;;
        "status")
            show_status
            ;;
        "backup")
            backup_data
            ;;
        "update")
            update_application
            ;;
        "clean"|"cleanup")
            cleanup
            ;;
        "help"|*)
            cat << EOF
Personal Finance Tracker - Docker Deployment Script

Usage: $0 [COMMAND]

Commands:
  dev, development  Start in development mode with hot reload
  prod, production  Start in production mode with optimizations
  start, up         Start the application (default mode)
  stop, down        Stop the application
  restart           Restart the application
  logs              View application logs
  status            Show application status
  backup            Create a backup of data
  update            Update and restart the application
  clean, cleanup    Stop and remove all containers and volumes
  help              Show this help message

Examples:
  $0 dev              # Start in development mode
  $0 prod             # Start in production mode
  $0 logs             # View logs
  $0 backup           # Create backup

For more information, see docker-README.md
EOF
            ;;
    esac
}

# Run main function with all arguments
main "$@"