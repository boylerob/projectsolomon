#!/bin/bash

# Project Solomon Backend Deployment Script
set -e

echo "🚀 Starting Project Solomon Backend Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Check if project is set correctly
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "book-guide-7ef1e" ]; then
    echo "❌ Error: Wrong project set. Current: $CURRENT_PROJECT, Expected: book-guide-7ef1e"
    echo "Run: gcloud config set project book-guide-7ef1e"
    exit 1
fi

echo "✅ Project verified: $CURRENT_PROJECT"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application (if needed)
echo "🔨 Building application..."
# Add any build steps here if needed

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy solomon-backend \
    --source . \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated \
    --memory=512Mi \
    --cpu=1 \
    --max-instances=10 \
    --min-instances=0 \
    --port=8080 \
    --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=book-guide-7ef1e,DATABASE_URL=postgresql://solomon_user:solomon_secure_pass_2024@34.45.138.156:5432/solomon_db"

echo "✅ Deployment completed successfully!"

# Get the service URL
SERVICE_URL=$(gcloud run services describe solomon-backend --region=us-central1 --format="value(status.url)")
echo "🌐 Service URL: $SERVICE_URL"

# Test the health endpoint
echo "🏥 Testing health endpoint..."
sleep 10  # Wait for service to be ready
curl -f "$SERVICE_URL/health" || echo "⚠️  Health check failed, but service may still be starting up"

echo "🎉 Deployment complete! Your backend is now running at: $SERVICE_URL"
echo ""
echo "📋 Next steps:"
echo "1. Set up your environment variables in Cloud Run"
echo "2. Import your biblical data into the database"
echo "3. Configure your frontend to use the new backend URL"
echo "4. Test the API endpoints" 