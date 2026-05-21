import { Router } from 'express';
import { LoadBalancerController } from '../controllers/LoadBalancerController';
import { LoadBalancerModel } from '../models/LoadBalancerModel';

export class LoadBalancerRoutes {
  private router: Router;
  private controller: LoadBalancerController;

  constructor(deviceId: string) {
    this.router = Router();
    const model = new LoadBalancerModel(deviceId);
    this.controller = new LoadBalancerController(model);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /telemetry - Retrieve telemetry data
    this.router.get('/telemetry', (req, res) => 
      this.controller.getTelemetry(req, res)
    );

    // GET /channels - Retrieve all channel data
    this.router.get('/channels', (req, res) => 
      this.controller.getChannels(req, res)
    );

    // POST /channels - Update channel data
    this.router.post('/channels', (req, res) => 
      this.controller.updateChannel(req, res)
    );

    // POST /relay - Set relay state for a channel
    this.router.post('/relay', (req, res) => 
      this.controller.setRelay(req, res)
    );

    // POST /reset - Reset system state
    this.router.post('/reset', (req, res) => 
      this.controller.resetSystem(req, res)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}