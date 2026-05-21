import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { LoadBalancerModel } from './models/LoadBalancerModel';
import { LoadBalancerRoutes } from './routes/LoadBalancerRoutes';

const app: Application = express();
const port = process.env.PORT || 3000;

// Initialize the load balancer model
const model = new LoadBalancerModel();

// Middleware setup
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize routes
const loadBalancerRoutes = new LoadBalancerRoutes(model);
app.use('/api/load-balancer', loadBalancerRoutes.getRouter());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Load Balancer API is running',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Load Balancer API server is running on port ${port}`);
  console.log(`Health check endpoint: http://localhost:${port}/health`);
});

export default app;