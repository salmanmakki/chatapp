#!/bin/bash

# ChatApp Frontend Deployment Script

echo "🚀 Starting ChatApp Frontend Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linting..."
npm run lint

# Build for production
echo "🏗️ Building for production..."
npm run build:prod

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build files are in the 'dist' directory"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Deploy the 'dist' folder to your hosting platform"
    echo "2. Ensure environment variables are set:"
    echo "   - VITE_API_URL=https://chatapp-back-3pmd.onrender.com"
    echo "   - VITE_SOCKET_URL=https://chatapp-back-3pmd.onrender.com"
    echo ""
    echo "🌐 Deployment options:"
    echo "- Vercel: vercel --prod"
    echo "- Netlify: netlify deploy --prod --dir=dist"
    echo "- Render: Upload dist folder via dashboard"
    echo ""
    echo "📋 Don't forget to test:"
    echo "- API connectivity"
    echo "- Socket.IO connection"
    echo "- Authentication flow"
    echo "- File uploads"
    echo "- Message requests feature"
else
    echo "❌ Build failed!"
    exit 1
fi
