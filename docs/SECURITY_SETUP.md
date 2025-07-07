# 🔒 Security Setup Guide

This guide explains how to securely configure your Plant Journey App without exposing sensitive URLs in your public repository.

## 🚨 Why This Matters

Previously, backend URLs were hardcoded in scripts and config files, which poses security risks when pushing to public repositories:

- Exposes your Google Cloud project details
- Makes your backend discoverable by unauthorized users
- Creates potential attack vectors
- Violates security best practices

## ✅ Secure Configuration

### Step 1: Environment Variables Setup

Run the automated setup script:

```bash
./scripts/setup-env.sh
```

Or manually configure:

```bash
# Copy the template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### Step 2: Required Environment Variables

Set these variables in your `.env` file:

```bash
# Your actual backend URL (replace with your Cloud Run URL)
BACKEND_API_URL=https://your-service-name-your-project-id.your-region.run.app
NEXT_PUBLIC_API_URL=https://your-service-name-your-project-id.your-region.run.app

# Google Cloud configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
CLOUD_RUN_SERVICE_NAME=plant-journey-backend
CLOUD_RUN_REGION=us-west2
```

### Step 3: Vercel Configuration

Set environment variables in Vercel Dashboard:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → Settings → Environment Variables
3. Add `NEXT_PUBLIC_API_URL` with your backend URL
4. Set for Production and Preview environments

Or use CLI:

```bash
vercel env add NEXT_PUBLIC_API_URL production --value="https://your-backend-url"
```

## 🛡️ Security Features Implemented

### 1. No Hardcoded URLs

All backend URLs are now loaded from environment variables:

- ✅ Scripts check for environment variables
- ✅ Fail safely if URLs not configured
- ✅ No sensitive URLs in source code

### 2. HTTPS Validation

All scripts now validate URL security:

- ✅ Require HTTPS URLs for production
- ✅ Reject HTTP URLs in production builds
- ✅ Validate URL format before deployment

### 3. Secure Logging

Scripts hide sensitive information in logs:

- ✅ URLs marked as "[CONFIGURED - HIDDEN FOR SECURITY]"
- ✅ No URL exposure in deployment output
- ✅ Generic error messages for missing config

### 4. Build Verification

Deployment scripts verify security:

- ✅ Check for HTTP URLs in build output
- ✅ Fail deployment if insecure URLs found
- ✅ Clear build cache to prevent issues

## 📁 Files Updated

The following files have been secured:

### Scripts
- `scripts/deploy-cloud.sh` - Uses environment variables
- `scripts/deploy-vercel.sh` - Environment variable validation  
- `scripts/debug-api-issue.sh` - Secure URL handling
- `scripts/setup-env.sh` - New setup helper

### Configuration
- `client/vercel.json` - Removed hardcoded URLs
- `.env.example` - Template with placeholder values
- `.gitignore` - Already excludes .env files

### Build Files
- `client/.next/` - Cleared to remove hardcoded URLs

## 🚀 Deployment Process

With the new secure setup:

```bash
# 1. Configure environment
./scripts/setup-env.sh

# 2. Deploy securely
./scripts/deploy-cloud.sh

# 3. Verify deployment
curl $BACKEND_API_URL/health
```

## ⚠️ Security Checklist

Before pushing to public repos:

- [ ] `.env` files are in `.gitignore`
- [ ] No hardcoded URLs in source code
- [ ] Environment variables configured in deployment platforms
- [ ] Build cache cleared of any hardcoded URLs
- [ ] HTTPS URLs only for production

## 🔍 Verification

Check your configuration:

```bash
# Verify no hardcoded URLs in codebase
grep -r "your-actual-backend-url" . --exclude-dir=node_modules --exclude-dir=.git

# Check environment variables
echo $BACKEND_API_URL

# Verify Vercel config
vercel env ls
```

## 🆘 Troubleshooting

### Environment Variable Not Found

Error: `❌ Backend API URL not found in environment variables!`

**Solution:**
1. Run `./scripts/setup-env.sh`
2. Or manually set: `export BACKEND_API_URL=https://your-url`

### HTTP URL in Production

Error: `❌ Backend API URL must use HTTPS for production deployment!`

**Solution:**
1. Update your URL to use `https://`
2. Ensure your backend supports HTTPS

### Build Contains HTTP URLs

Error: `❌ Found HTTP weather URLs in build`

**Solution:**
1. Clear build cache: `rm -rf client/.next`
2. Rebuild with correct env: `NEXT_PUBLIC_API_URL=https://your-url npm run build`

## 📞 Support

If you encounter issues:

1. Run `./scripts/debug-api-issue.sh` for automated diagnosis
2. Check the build logs for specific error messages
3. Verify your environment variables are set correctly
4. Ensure your backend URL is accessible via HTTPS

---

**Remember:** Security is not a one-time setup. Regularly review your configuration and keep sensitive information out of your public repositories.
