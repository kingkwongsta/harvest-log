# 🌱 Harvest Log

A modern, full-stack harvest logging application that helps gardeners and farmers track, analyze, and optimize their crop yields. Built with Next.js 15, FastAPI, and Supabase for a seamless experience across web and mobile devices.

## ✨ Features

### 🍎 Core Functionality
- **Harvest Logging**: Easy-to-use forms for recording harvest data with photos
- **Photo Management**: Upload, compress, and organize harvest photos
- **Analytics Dashboard**: Visual insights into harvest patterns and productivity
- **Mobile-Friendly**: Responsive design optimized for phones and tablets
- **Data Export**: Export harvest data for analysis and record-keeping

### 🔧 Technical Highlights
- **Modern Stack**: Next.js 15 with App Router, React 19, TypeScript
- **Real-time Database**: Supabase PostgreSQL with Row Level Security
- **Image Processing**: Automatic compression and optimization
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **Comprehensive Testing**: Unit, integration, and end-to-end tests
- **Docker Support**: Containerized deployment ready

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Next.js 15 Frontend           │
│  ┌─────────────────┐ ┌─────────────────┐│
│  │  React 19 UI    │ │  TypeScript     ││
│  │  Tailwind CSS   │ │  Radix UI       ││
│  └─────────────────┘ └─────────────────┘│
└─────────────────┬───────────────────────┘
                  │ HTTP/REST API
                  │
        ┌─────────▼──────────┐
        │    FastAPI         │
        │   Python Backend   │
        │   + Image Upload   │
        └─────────┬──────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐ ┌─────▼─────┐ ┌─────▼─────┐
│Supabase│ │  Storage  │ │   Auth    │
│Database│ │  (Images) │ │  (Future) │
│+ RLS   │ │           │ │           │
└────────┘ └───────────┘ └───────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+ and pip
- **Supabase** account and project
- **Git** for version control

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd harvest-log
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Frontend Setup
```bash
cd ../client
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
```

### 4. Database Setup
```bash
# Run the SQL setup script in your Supabase SQL editor
cat backend/setup_supabase.sql
```

### 5. Start Development Servers
```bash
# From the project root
./scripts/start-dev.sh
```

Your app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📁 Project Structure

```
harvest-log/
├── 📁 backend/                 # FastAPI Python backend
│   ├── 📁 app/                 # Application code
│   │   ├── main.py            # FastAPI app configuration
│   │   ├── models.py          # Pydantic data models
│   │   ├── config.py          # Settings and configuration
│   │   ├── database.py        # Supabase client setup
│   │   ├── storage.py         # Image storage service
│   │   └── 📁 routers/        # API endpoints
│   │       ├── harvest_logs.py # CRUD operations
│   │       └── images.py      # Image upload/management
│   ├── 📁 tests/              # Test suite
│   │   ├── 📁 unit/           # Unit tests
│   │   ├── 📁 integration/    # Integration tests
│   │   └── 📁 manual/         # Manual testing tools
│   ├── requirements.txt       # Python dependencies
│   └── setup_supabase.sql     # Database schema
├── 📁 client/                 # Next.js 15 frontend
│   ├── 📁 app/                # App Router pages
│   │   ├── page.tsx           # Homepage with quick entry
│   │   ├── 📁 harvests/       # Harvest management
│   │   ├── 📁 analytics/      # Data visualization
│   │   └── 📁 photos/         # Photo gallery
│   ├── 📁 components/         # React components
│   │   └── 📁 ui/             # Reusable UI components
│   ├── 📁 lib/                # Utilities and API client
│   ├── package.json           # Node.js dependencies
│   └── next.config.ts         # Next.js configuration
├── 📁 docs/                   # Documentation
│   ├── SETUP_GUIDE.md         # Detailed setup instructions
│   ├── DEPLOYMENT.md          # Deployment options
│   ├── BACKEND_README.md      # Backend technical details
│   └── API_LOGGING_SUMMARY.md # Logging and monitoring
├── 📁 scripts/                # Development and deployment scripts
│   ├── start-dev.sh           # Start development servers
│   ├── deploy-local.sh        # Docker deployment
│   └── deploy-to-cloudrun.sh  # Cloud deployment
├── docker-compose.yml         # Docker multi-service setup
└── README.md                  # This file
```

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests (when implemented)
cd client
npm test
```

### API Development
- **Interactive Docs**: Visit http://localhost:8000/docs
- **API Client**: Located in `client/lib/api.ts`
- **Request Logging**: Comprehensive logging for debugging

### Adding New Features
1. **Backend**: Add routes in `backend/app/routers/`
2. **Frontend**: Add pages in `client/app/` or components in `client/components/`
3. **Database**: Update `backend/setup_supabase.sql` for schema changes
4. **Tests**: Add tests in appropriate `tests/` directories

## 🐳 Deployment

### Local Docker Deployment
```bash
./scripts/deploy-local.sh
```

### Cloud Deployment Options

#### Option 1: Vercel + Railway
- **Frontend**: Deploy to Vercel (automatic from GitHub)
- **Backend**: Deploy to Railway with PostgreSQL addon

#### Option 2: Single Platform
- **Railway**: Full-stack deployment with database
- **Render**: Alternative full-stack option

See `docs/DEPLOYMENT.md` for detailed deployment instructions.

## 📊 Data Model

### Harvest Logs
- **Basic Info**: Crop name, quantity, unit, date
- **Location**: GPS coordinates or text description
- **Conditions**: Weather, soil conditions, notes
- **Images**: Multiple photos with automatic compression

### Image Management
- **Upload**: Drag-and-drop with progress indicators
- **Processing**: Automatic compression and resizing
- **Storage**: Supabase Storage with CDN delivery
- **Metadata**: File size, dimensions, compression ratios

## 🔐 Security

- **Row Level Security**: Supabase RLS policies protect user data
- **CORS Configuration**: Properly configured for frontend access
- **Input Validation**: Pydantic models validate all API inputs
- **File Upload Security**: Type checking and size limits

## 📈 Monitoring & Logging

The application includes comprehensive logging:
- **Request Tracking**: Unique request IDs for tracing
- **Performance Monitoring**: Response time tracking
- **Error Logging**: Detailed error information with context
- **Database Operations**: All CRUD operations logged

See `docs/API_LOGGING_SUMMARY.md` for detailed logging information.

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Test** your changes thoroughly
4. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**:
- Check `.env` file exists with correct Supabase credentials
- Verify Python virtual environment is activated
- Check port 8000 isn't already in use

**Frontend can't connect to API**:
- Ensure backend is running on port 8000
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Verify CORS settings in backend configuration

**Database connection errors**:
- Verify Supabase URL and keys in `.env`
- Check if database schema is properly set up
- Ensure RLS policies are configured correctly

**Image upload failures**:
- Check Supabase Storage bucket permissions
- Verify file size limits and supported formats
- Check browser console for detailed error messages

For more troubleshooting information, see the documentation in the `docs/` folder.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js** team for the excellent React framework
- **FastAPI** for the high-performance Python web framework
- **Supabase** for the backend-as-a-service platform
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for the utility-first CSS framework

---

**Happy Harvesting! 🌾**

For questions or support, please open an issue or check the documentation in the `docs/` folder. 