# Dental Automation System - Deployment Guide

## 🚀 Backend Deployment to Render + MongoDB Atlas

### Prerequisites
- MongoDB Atlas account (free tier available)
- Render account (free tier available)
- Git repository with your code

### Step 1: MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account
   - Verify your email address

2. **Create a New Cluster**
   - Click "Build a Cluster"
   - Choose "Shared" (free tier)
   - Select your preferred cloud provider (AWS, Google Cloud, or Azure)
   - Choose a region close to your target users
   - Name your cluster (e.g., "dental-automation")
   - Click "Create Cluster" (takes ~10 minutes)

3. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and strong password (save these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for Render deployment
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `myFirstDatabase` with `dental_automation`

### Step 2: Update Production Environment

Update your `.env.production` file with the MongoDB Atlas connection string:

```bash
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/dental_automation?retryWrites=true&w=majority
```

### Step 3: Render Deployment

1. **Create Web Service on Render**
   - Go to [https://render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub/GitLab repository
   - Configure the service:
     - **Name**: `dental-automation-backend`
     - **Environment**: `Node`
     - **Build Command**: `npm run build:server`
     - **Start Command**: `npm run start:prod`
     - **Instance Type**: Free (or paid for better performance)

2. **Add Environment Variables**
   - Add all variables from `.env.production` to Render
   - Make sure to use your actual MongoDB Atlas connection string
   - Generate a strong JWT secret (minimum 32 characters)

3. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL (e.g., `https://dental-automation-backend.onrender.com`)

### Step 4: Update Frontend API URLs

After backend deployment, update your frontend to point to the Render backend:

1. Update the frontend environment variables
2. Redeploy frontend to Vercel
3. Test the full integration

### Step 5: Post-Deployment Verification

1. **Test Authentication**
   - Try logging in with existing credentials
   - Create a new user account

2. **Test Core Features**
   - Create a patient record
   - Schedule an appointment
   - Generate an invoice

3. **Monitor Logs**
   - Check Render logs for any errors
   - Monitor MongoDB Atlas usage

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify connection string format
   - Check IP whitelist settings
   - Ensure database user has correct permissions

2. **JWT Authentication Issues**
   - Verify JWT_SECRET is set correctly
   - Check token expiration settings
   - Ensure frontend/backend secrets match

3. **CORS Issues**
   - Verify FRONTEND_URL in backend matches your frontend URL
   - Check CORS configuration in backend

4. **File Upload Issues**
   - Ensure upload directory exists on Render
   - Check file size limits
   - Verify file permissions

### Performance Optimization

1. **Database Indexes**
   - Create indexes on frequently queried fields
   - Monitor slow queries in MongoDB Atlas

2. **Caching**
   - Consider adding Redis for session management
   - Implement API response caching

3. **CDN Integration**
   - Use CloudFront or Cloudflare for static assets
   - Optimize image delivery

## 📊 Monitoring & Maintenance

### Render Monitoring
- Monitor application logs
- Set up alerts for downtime
- Track resource usage

### MongoDB Atlas Monitoring
- Monitor database performance
- Set up alerts for high usage
- Review connection pool metrics

### Security Checklist
- [ ] Use strong passwords
- [ ] Enable 2FA on all accounts
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Backup database regularly

## 📞 Support

If you encounter issues:
1. Check application logs in Render dashboard
2. Review MongoDB Atlas connection logs
3. Test API endpoints manually
4. Check browser console for frontend errors

For specific errors, provide:
- Error messages
- Deployment configuration
- Environment variables (without sensitive data)
- Recent changes made