import express from 'express';
import cors from 'cors';
import {
  responseEnvelopeMiddleware,
  notFoundHandler,
  errorHandler,
} from './middleware/responseEnvelope.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import employeesRouter from './routes/employees.js';
import schedulesRouter from './routes/schedules.js';
import contractsRouter from './routes/contracts.js';

const app = express();

// Standard response helpers attached first
app.use(responseEnvelopeMiddleware);

// Security and body parsers
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount health and API routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/contracts', contractsRouter);

// Fallbacks and error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
