#!/bin/bash

# Solomon Biblical Backend - Google Cloud Deployment Script
# This script sets up and deploys the backend to Google Cloud

set -e

echo "🚀 Starting Solomon Biblical Backend deployment to Google Cloud..."

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID:-"your-project-id"}
REGION=${GOOGLE_CLOUD_REGION:-"us-central1"}
SERVICE_NAME="solomon-backend"
DB_INSTANCE_NAME="solomon-biblical-db"
REDIS_INSTANCE_NAME="solomon-cache"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_warning "You are not authenticated with gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
print_status "Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable firebase.googleapis.com

# Create Cloud SQL instance (PostgreSQL)
print_status "Creating Cloud SQL instance..."
gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time="02:00" \
    --maintenance-window-day=SUN \
    --maintenance-window-hour=03 \
    --availability-type=zonal \
    --no-deletion-protection

# Create database
print_status "Creating database..."
gcloud sql databases create solomon_biblical --instance=$DB_INSTANCE_NAME

# Create database user
print_status "Creating database user..."
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create solomon_user \
    --instance=$DB_INSTANCE_NAME \
    --password=$DB_PASSWORD

# Get database connection info
DB_HOST=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")
print_status "Database connection: $DB_HOST"

# Create Redis instance (Cloud Memorystore)
print_status "Creating Redis instance..."
gcloud redis instances create $REDIS_INSTANCE_NAME \
    --size=1 \
    --region=$REGION \
    --redis-version=redis_6_x

# Get Redis connection info
REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --format="value(host)")
print_status "Redis connection: $REDIS_HOST"

# Create Cloud Storage bucket
print_status "Creating Cloud Storage bucket..."
BUCKET_NAME="solomon-biblical-data-$PROJECT_ID"
gsutil mb -l $REGION gs://$BUCKET_NAME

# Build and deploy to Cloud Run
print_status "Building and deploying to Cloud Run..."

# Create .env file for deployment
cat > .env << EOF
NODE_ENV=production
PORT=8080
DB_HOST=$DB_HOST
DB_PORT=5432
DB_NAME=solomon_biblical
DB_USER=solomon_user
DB_PASSWORD=$DB_PASSWORD
GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID
GOOGLE_CLOUD_STORAGE_BUCKET=$BUCKET_NAME
REDIS_HOST=$REDIS_HOST
REDIS_PORT=6379
EOF

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --max-instances=10 \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="DB_HOST=$DB_HOST" \
    --set-env-vars="DB_NAME=solomon_biblical" \
    --set-env-vars="DB_USER=solomon_user" \
    --set-env-vars="REDIS_HOST=$REDIS_HOST" \
    --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID" \
    --set-env-vars="GOOGLE_CLOUD_STORAGE_BUCKET=$BUCKET_NAME"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
print_status "Service deployed successfully!"
print_status "Service URL: $SERVICE_URL"

# Create a secret for the database password
print_status "Creating database password secret..."
echo -n "$DB_PASSWORD" | gcloud secrets create db-password --data-file=-

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding db-password \
    --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Update the service to use the secret
gcloud run services update $SERVICE_NAME \
    --region=$REGION \
    --set-secrets="DB_PASSWORD=db-password:latest"

# Clean up
rm -f .env

print_status "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "  - Project ID: $PROJECT_ID"
echo "  - Region: $REGION"
echo "  - Service URL: $SERVICE_URL"
echo "  - Database: $DB_HOST"
echo "  - Redis: $REDIS_HOST"
echo "  - Storage: gs://$BUCKET_NAME"
echo ""
echo "🔧 Next steps:"
echo "  1. Set up Firebase configuration"
echo "  2. Configure Gemini API key"
echo "  3. Import biblical data"
echo "  4. Test the API endpoints"
echo ""
echo "📚 API Documentation: $SERVICE_URL/health" 