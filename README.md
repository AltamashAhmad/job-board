# Job Board Application

A scalable job board application that aggregates jobs from multiple sources, processes them through a queue system, and provides a clean interface for viewing job listings and import history.

## Features

- Multiple job source API integration
- Redis-based queue processing
- MongoDB for data persistence
- Import history tracking
- Real-time job updates
- Configurable batch processing
- Automatic retries with exponential backoff

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: React, TailwindCSS
- **Database**: MongoDB Atlas
- **Queue**: Redis Cloud (BullMQ)
- **Deployment**: Render (Backend), Vercel (Frontend)

## Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account
- Redis Cloud account
- Render account (for deployment)
- Vercel account (for frontend deployment)

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=your_mongodb_uri
REDIS_URL=your_redis_url
CORS_ORIGIN=http://localhost:3000
QUEUE_BATCH_SIZE=10
QUEUE_MAX_CONCURRENCY=5
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3000
```

## Local Development

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
   - Copy `.env.example` to `.env` in both server and client directories
   - Update the variables with your credentials

4. Start the development servers:
   ```bash
   # Start backend (from server directory)
   npm run dev

   # Start frontend (from client directory)
   npm start
   ```

## Deployment

### Backend (Render)

1. Fork this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure environment variables in Render dashboard
5. Deploy

### Frontend (Vercel)

1. Push your frontend code to a GitHub repository
2. Import the repository in Vercel
3. Configure environment variables
4. Deploy

## API Documentation

API documentation is available at `/api-docs` when running the server.

## Architecture

The application follows a modular architecture:

- `/server` - Backend application
  - `/config` - Configuration files
  - `/models` - Database models
  - `/routes` - API routes
  - `/services` - Business logic
  - `/queues` - Queue management
  - `/workers` - Job processing workers

- `/client` - Frontend application
  - `/src/components` - React components
  - `/src/pages` - Page components
  - `/src/services` - API services
  - `/src/store` - State management

## Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
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

This project is licensed under the ISC License.

## Support

For support, email your.email@example.com or open an issue in the repository.