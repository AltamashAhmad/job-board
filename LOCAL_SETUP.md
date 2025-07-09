# Job Board - Local Development Setup

## ✅ Project Status: Ready for Local Development

Your Job Board application has been successfully configured for local-only development. All deployment-specific configurations have been removed, and the project is now optimized for local development.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 18.0.0
- MongoDB (Local)
- Redis (Local)

### 2. Start Services

**MongoDB:**
```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Or manually:
mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
```

**Redis:**
```bash
# macOS (using Homebrew)
brew services start redis

# Or manually:
redis-server
```

### 3. Start the Application

**Backend (Server):**
```bash
cd server
npm install
npm run dev
```
Server will run on: http://localhost:5002

**Frontend (Client):**
```bash
cd client
npm install
npm start
```
Client will run on: http://localhost:3000

## 🔧 Environment Configuration

The project includes pre-configured environment files:

- `server/.env` - Backend configuration
- `client/.env` - Frontend configuration

Both files are already set up for local development with:
- MongoDB: `mongodb://localhost:27017/job_board`
- Redis: `redis://localhost:6379`
- API URL: `http://localhost:5002`

## 📊 Features Working Locally

✅ **Job Source API Integration**
- Multiple Jobicy APIs configured
- XML to JSON conversion
- 1-hour cron job scheduling

✅ **Queue System (Redis + BullMQ)**
- Background job processing
- Configurable concurrency
- Error handling and retries

✅ **Worker Processing System**
- Job processing workers
- Database operations (insert/update)
- Failed job tracking

✅ **Import History Tracking**
- Import logs collection
- Metrics tracking (Total/New/Updated/Failed)
- Status management

✅ **API Layer**
- `/api/imports` - Import history
- `/api/jobs` - Job listings
- `/health` - System health check

✅ **Admin UI (React)**
- Dashboard layout
- Import history table
- Job listings view
- Responsive design with Tailwind CSS

## 🧪 Testing

**Health Check:**
```bash
curl http://localhost:5002/health
```

**API Endpoints:**
```bash
# Import history
curl http://localhost:5002/api/imports

# Job listings
curl http://localhost:5002/api/jobs
```

## 📁 Project Structure

```
job-board/
├── server/                 # Backend application
│   ├── config/            # Configuration files
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── queues/            # Queue management
│   ├── workers/           # Job processing workers
│   └── tests/             # Test files
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
│   └── public/            # Static assets
└── docs/                  # Documentation
```

## 🔄 Development Workflow

1. **Start Services:** MongoDB and Redis
2. **Start Backend:** `cd server && npm run dev`
3. **Start Frontend:** `cd client && npm start`
4. **Access Application:** http://localhost:3000
5. **Monitor Logs:** Check console output for job processing

## 🐛 Troubleshooting

**MongoDB Connection Issues:**
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Start MongoDB if not running
brew services start mongodb-community
```

**Redis Connection Issues:**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis if not running
brew services start redis
```

**Port Conflicts:**
- Backend: Change `PORT` in `server/.env`
- Frontend: Change `REACT_APP_API_URL` in `client/.env`

## 📝 Notes

- All deployment configurations (Render, Vercel) have been removed
- Environment variables are configured for local development
- The application uses local MongoDB and Redis instances
- No cloud services are required for development
- All features are fully functional in the local environment

## 🎯 Next Steps

1. **Test the Application:** Visit http://localhost:3000
2. **Monitor Job Processing:** Check server logs for cron job execution
3. **Explore Features:** Use the dashboard to view import history and jobs
4. **Development:** Make changes and see them reflected immediately

Your Job Board application is now fully configured for local development! 🎉 