import { Request, Response } from 'express';
import { LoadBalancerModel } from '../models/LoadBalancerModel';
import { ChannelData, TelemetryData } from '../types';

export class LoadBalancerController {
  private model: LoadBalancerModel;

  constructor(model: LoadBalancerModel) {
    this.model = model;
  }

  /**
   * Get telemetry data
   */
  async getTelemetry(req: Request, res: Response): Promise<Response> {
    try {
      const telemetry = this.model.getTelemetry();
      return res.status(200).json(telemetry);
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to retrieve telemetry data',
        details: (error as Error).message 
      });
    }
  }

  /**
   * Get all channel data
   */
  async getChannels(req: Request, res: Response): Promise<Response> {
    try {
      const channels = this.model.getChannels();
      return res.status(200).json(channels);
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to retrieve channel data',
        details: (error as Error).message 
      });
    }
  }

  /**
   * Update channel data
   */
  async updateChannel(req: Request, res: Response): Promise<Response> {
    try {
      const { channelId, current } = req.body;
      
      // Validate channel ID - should be A, B, or C
      const validChannels = ['A', 'B', 'C'];
      if (!validChannels.includes(channelId)) {
        return res.status(400).json({ 
          error: 'Invalid channel ID. Must be A, B, or C' 
        });
      }

      if (typeof current !== 'number' || current < 0) {
        return res.status(400).json({ 
          error: 'Invalid current value. Must be a positive number' 
        });
      }

      const success = this.model.updateChannel(channelId, current);
      
      if (!success) {
        return res.status(400).json({ 
          error: 'Failed to update channel data' 
        });
      }
      
      // Return updated channel data
      const channel = this.model.getChannel(channelId);
      return res.status(200).json({ 
        success: true,
        channel: channel
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to update channel data',
        details: (error as Error).message 
      });
    }
  }

  /**
   * Set relay state for a channel
   */
  async setRelay(req: Request, res: Response): Promise<Response> {
    try {
      const { channelId, state } = req.body;
      
      // Validate channel ID - should be A, B, or C
      const validChannels = ['A', 'B', 'C'];
      if (!validChannels.includes(channelId)) {
        return res.status(400).json({ 
          error: 'Invalid channel ID. Must be A, B, or C' 
        });
      }

      if (typeof state !== 'boolean') {
        return res.status(400).json({ 
          error: 'Invalid relay state. Must be a boolean value' 
        });
      }

      const success = this.model.setRelayState(channelId, state);
      
      if (!success) {
        return res.status(400).json({ 
          error: 'Failed to set relay state' 
        });
      }
      
      // Return updated channel data
      const channel = this.model.getChannel(channelId);
      return res.status(200).json({ 
        success: true,
        channel: channel
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to set relay state',
        details: (error as Error).message 
      });
    }
  }

  /**
   * Reset system state
   */
  async resetSystem(req: Request, res: Response): Promise<Response> {
    try {
      this.model.reset();
      return res.status(200).json({ 
        success: true,
        message: 'System reset successfully'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to reset system',
        details: (error as Error).message 
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<Response> {
    try {
      // For a health check, we can return basic system status
      const telemetry = this.model.getTelemetry();
      return res.status(200).json({ 
        status: 'healthy',
        device: telemetry.device,
        uptime: telemetry.uptime,
        events: telemetry.events
      });
    } catch (error) {
      return res.status(500).json({ 
        status: 'unhealthy',
        error: (error as Error).message 
      });
    }
  }
}
