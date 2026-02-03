# ChatApp Frontend Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+
- npm or yarn
- Access to your backend URL: `https://chatapp-back-3pmd.onrender.com`

### Environment Setup

1. **Environment Variables**
   ```bash
   # Create .env.production file
   VITE_API_URL=https://chatapp-back-3pmd.onrender.com
   VITE_SOCKET_URL=https://chatapp-back-3pmd.onrender.com
   ```

### Build for Production

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build Production Bundle**
   ```bash
   npm run build:prod
   ```

3. **Preview Build**
   ```bash
   npm run preview
   ```

### Deployment Options

#### 1. **Vercel** (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### 2. **Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### 3. **Render**
- Connect your GitHub repository
- Set build command: `npm run build:prod`
- Set publish directory: `dist`
- Add environment variables

#### 4. **AWS S3 + CloudFront**
```bash
# Install AWS CLI
aws s3 sync dist/ s3://your-bucket-name --delete
```

### Production Optimizations

✅ **Already Configured:**
- Code minification with Terser
- Console logs removed in production
- Bundle splitting for better caching
- Source maps disabled
- Proper chunk size limits
- SEO meta tags
- Security headers

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://chatapp-back-3pmd.onrender.com` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `https://chatapp-back-3pmd.onrender.com` |

### Post-Deployment Checklist

- [ ] Verify API connectivity
- [ ] Test Socket.IO connection
- [ ] Check authentication flow
- [ ] Test file uploads
- [ ] Verify message requests feature
- [ ] Test responsive design
- [ ] Check browser console for errors

### Troubleshooting

#### Common Issues:

1. **CORS Errors**
   - Ensure backend allows your frontend domain
   - Check backend CORS configuration

2. **Socket.IO Connection Issues**
   - Verify `VITE_SOCKET_URL` is correct
   - Check if backend Socket.IO is running

3. **API 404 Errors**
   - Verify `VITE_API_URL` is correct
   - Check if backend routes are properly configured

4. **File Upload Issues**
   - Ensure backend has proper file upload middleware
   - Check file size limits

### Performance Tips

- Enable gzip compression on your hosting platform
- Set up proper caching headers for static assets
- Consider CDN for static assets
- Monitor bundle size regularly

### Security Considerations

- Always use HTTPS in production
- Validate environment variables
- Keep dependencies updated
- Monitor for security vulnerabilities
- Set up proper CSP headers if needed
