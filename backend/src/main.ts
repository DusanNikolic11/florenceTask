import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { connectDatabase } from './config/database';
import { configurePassport } from './config/passport';
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

configurePassport();

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const start = async (): Promise<void> => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
