# 🚀 Plant Journey Deployment Guide

Since you'll primarily use the app on your home wifi, **local deployment is recommended** for your use case.

## 🏠 Local Deployment Options

### Option 1: Simple Development Mode (Easiest)

**Perfect for:** Daily use, development, no Docker required

```bash
# 1. Make sure you have Python virtual environment set up
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Create .env file with your Supabase credentials
echo "SUPABASE_URL=your_supabase_url" > .env
echo "SUPABASE_KEY=your_supabase_anon_key" >> .env

# 3. Install frontend dependencies
cd ../client
npm install

# 4. Start both servers with one command
cd ..
./start-dev.sh
```

**Access your app at:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- From other devices on your network: http://YOUR-LOCAL-IP:3000

### Option 2: Docker Production Setup (More Robust)

**Perfect for:** Production-like environment, automatic restarts, isolation

```bash
# 1. Make sure Docker is installed and running
docker --version

# 2. Create backend/.env file with your Supabase credentials
echo "SUPABASE_URL=your_supabase_url" > backend/.env
echo "SUPABASE_KEY=your_supabase_anon_key" >> backend/.env

# 3. Deploy with Docker Compose
./deploy-local.sh
```

**Management commands:**
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update and restart
./deploy-local.sh
```

## 📱 Network Access

Both options will make your app accessible to any device on your home network:

- **iPhone/iPad:** Open Safari and go to `http://YOUR-LOCAL-IP:3000`
- **Other computers:** Open any browser and go to `http://YOUR-LOCAL-IP:3000`
- **Find your local IP:** Run `ipconfig getifaddr en0` on macOS or `hostname -I` on Linux

## 🔒 Security Considerations

Since this is local deployment:
- ✅ No internet exposure by default
- ✅ Data stays on your network
- ✅ Fast and private
- ⚠️ Only accessible on your home network (unless you configure port forwarding)

## 🌐 Cloud Deployment (If Needed Later)

If you later decide you want remote access, here are good options:

### Quick Cloud Options:
1. **Vercel** (Frontend) + **Railway** (Backend) - ~$10-20/month
2. **Netlify** (Frontend) + **Render** (Backend) - ~$15-25/month  
3. **Both on Railway** - ~$10-15/month

### Setup commands for cloud deployment:
```bash
# Example: Deploy to Railway
npm install -g @railway/cli
railway login
railway init
railway up
```

## 💡 Recommendation

**Start with Option 1** (simple development mode) since it's:
- Zero additional setup
- Perfect for home use
- Easy to modify and debug
- No Docker complexity

**Upgrade to Option 2** (Docker) later if you want:
- Automatic startup on computer boot
- More isolation between services
- Production-like environment

## 🆘 Troubleshooting

**Services won't start:**
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :8000

# Kill processes using those ports
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:8000)
```

**Can't access from other devices:**
- Make sure your computer's firewall allows connections on ports 3000 and 8000
- Verify you're using the correct local IP address
- Both devices must be on the same WiFi network 