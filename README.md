# Job Board - Scalable Job Import System

A scalable job import system that fetches job listings from multiple sources, processes them through a queue, and provides real-time import tracking.

## Features

- 🔄 Automated job fetching from multiple sources
- 📊 Real-time import tracking and metrics
- 🚀 Queue-based processing with Redis
- 📈 Beautiful dashboard with import history
- 🛠 Configurable worker system
- 📝 Detailed logging and error tracking

## Tech Stack

- **Frontend**: React with TailwindCSS
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Queue**: Redis + BullMQ
- **Testing**: Jest

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB
- Redis

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/job-board.git
cd job-board
```

2. Install dependencies:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables:

Create `.env` files in both `server` and `client` directories:

Server `.env`:
```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/job-board
REDIS_HOST=localhost
REDIS_PORT=6379
```

Client `.env`:
```env
REACT_APP_API_URL=http://localhost:5002
```

## Running the Application

1. Start MongoDB and Redis:
```bash
# Start MongoDB (if not running as a service)
mongod

# Start Redis (if not running as a service)
redis-server
```

2. Start the backend:
```bash
cd server
npm run dev
```

3. Start the frontend:
```bash
cd client
npm start
```

4. Start the worker:
```bash
cd server
npm run worker
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5002

## Project Structure

```
job-board/
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── ...
│   └── ...
├── server/               # Backend Node.js application
│   ├── config/          # Configuration files
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── workers/         # Queue workers
│   └── ...
└── docs/                # Documentation
    └── architecture.md  # System design documentation
```

## API Documentation

### Import History
- `GET /api/imports` - List all imports
- `GET /api/imports/:id` - Get specific import details

### Jobs
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/dashboard` - Get dashboard statistics

## Testing

Run tests for the backend:
```bash
cd server
npm test
```

Run tests for the frontend:
```bash
cd client
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Jobicy](https://jobicy.com) for providing the job feed APIs
- [BullMQ](https://docs.bullmq.io/) for the robust queue system
- [TailwindCSS](https://tailwindcss.com) for the beautiful UI components



