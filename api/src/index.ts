import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { LoadBalancerRoutes } from './routes/loadBalancerRoutes';

const app = express();
const PORT = process.env.PORT || 3000;
const DEVICE_ID = process.env.DEVICE_ID || 'smart-load-balancer-001';

// Middleware setup
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize routes
const loadBalancerRoutes = new LoadBalancerRoutes(DEVICE_ID);
app.use('/api/load-balancer', loadBalancerRoutes.getRouter());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    service: 'Smart Load Balancing API',
    timestamp: new Date().toISOString()
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Smart Load Balancing API server running on port ${PORT}`);
  console.log(`Device ID: ${DEVICE_ID}`);
});

export default app;