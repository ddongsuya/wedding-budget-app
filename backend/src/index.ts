import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import coupleRoutes from './routes/couple';
import coupleProfileRoutes from './routes/coupleProfile';
import venueRoutes from './routes/venues';
import budgetRoutes from './routes/budget';
import expenseRoutes from './routes/expenses';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS 설정
app.use(cors({
  origin: true, // 모든 origin 허용 (개발용)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24시간
}));

// Preflight 요청 처리
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/couple', coupleRoutes);
app.use('/api/couple', coupleProfileRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
