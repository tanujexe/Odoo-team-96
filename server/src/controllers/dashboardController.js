import { getDashboardMetrics } from '../services/dashboardService.js';

export async function getDashboard(req, res, next) {
  try {
    const metrics = await getDashboardMetrics(req.query);
    return res.success(metrics);
  } catch (error) {
    next(error);
  }
}
