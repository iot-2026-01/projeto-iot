import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { LoadBalancerRoutes } from './routes/loadBalancerRoutes';
import { LoadBalancerModel } from './models/LoadBalancerModel';
import { MqttSubscriberService } from './services/MqttSubscriberService';

const app = express();
const PORT = process.env.PORT || 3000;
const DEVICE_ID = process.env.DEVICE_ID || 'balancer-01';

// Shared model instance — populated by MQTT, read by HTTP routes
const model = new LoadBalancerModel(DEVICE_ID);

// Middleware setup
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize routes (pass the shared model)
const loadBalancerRoutes = new LoadBalancerRoutes(DEVICE_ID, model);
app.use('/api/load-balancer', loadBalancerRoutes.getRouter());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Smart Load Balancing API',
    timestamp: new Date().toISOString()
  });
});

// Handle 404
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Smart Load Balancing API server running on port ${PORT}`);
  console.log(`Device ID: ${DEVICE_ID}`);
});

// Start MQTT subscriber (shares the same model)
const mqttSubscriber = new MqttSubscriberService(model);
mqttSubscriber.connect();

// Graceful shutdown
const shutdown = (): void => {
  console.log('\nShutting down...');
  mqttSubscriber.disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

export default app;
