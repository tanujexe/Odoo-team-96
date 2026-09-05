import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/health', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = dbStateMap[mongoose.connection.readyState] || 'unknown';

  return res.success({
    status: 'OK',
    service: 'PeoplePay360 Backend',
    database: dbState,
    timestamp: new Date().toISOString(),
  });
});

export default router;
