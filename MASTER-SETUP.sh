#!/bin/bash
set -e

echo "🚀 SHOTHIK MASTER SETUP 🚀"
echo "============================="

# 1. Cleanup Port 8080 (Backend)
echo "🧹 Checking Port 8080..."
lsof -ti :8080 | xargs kill -9 2>/dev/null || true
docker rm -f nlp-dev 2>/dev/null || true
echo "✅ Port 8080 cleared."

# 2. Try Pulling Cloud Production Image
echo "☁️  Attempting to pull Cloud Image (habiib91/nlp-inference-service:latest)..."
if docker pull habiib91/nlp-inference-service:latest; then
    echo "✅ Cloud Image Found! Starting Production Service..."
    docker run -d --name nlp-service -p 8080:8080 habiib91/nlp-inference-service:latest
    echo "🎉 NLP Backend is LIVE (Production Mode)."
else
    echo "⚠️  Cloud Image not ready yet."
    echo "🔄 Starting with LOCALLY built image (nlp-inference-service:latest)..."
    
    # Run the locally built image
    if ! docker image inspect nlp-inference-service:latest >/dev/null 2>&1; then
        echo "❌ ERROR: Local image nlp-inference-service:latest not found!"
        echo "   Please build the image first or ensure it exists locally."
        exit 1
    fi
    docker run -d --name nlp-service -p 8080:8080 nlp-inference-service:latest
fi

echo ""
echo "============================="
echo "3. Application Status"
echo "   - NLP Backend: http://localhost:8080"
echo "   - Frontend:    http://localhost:3000 (Make sure to restart 'npm run dev'!)"
echo "============================="
