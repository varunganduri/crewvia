const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173',  "https://radiant-macaron-4182b1.netlify.app"
],
  credentials: true,
}));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/interviews', require('./routes/interviewRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes')); // ADDED: Reports route
app.use('/api/notifications', require('./routes/notificationRoutes')); // ADDED: Notifications route


// Nested routes for candidate-specific data
const { protect } = require('./middlewares/auth');
const { getCandidateApplications } = require('./controllers/applicationController');
const { getCandidateInterviews } = require('./controllers/interviewController');
const { getCandidatePayments } = require('./controllers/paymentController');

app.get('/api/candidates/:candidateId/applications', protect, getCandidateApplications);
app.get('/api/candidates/:candidateId/interviews', protect, getCandidateInterviews);
app.get('/api/candidates/:candidateId/payments', protect, getCandidatePayments);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Crewvia Consultancy API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
