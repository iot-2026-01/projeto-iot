import { LoadBalancerController } from '../controllers/LoadBalancerController';
import { CurrentReading } from '../types';

describe('LoadBalancerController', () => {
  let controller: LoadBalancerController;

  beforeEach(() => {
    controller = new LoadBalancerController('test-device-001');
  });

  test('should initialize with correct device ID', () => {
    expect(controller).toBeDefined();
  });

  test('should update channel data correctly', () => {
    controller.updateChannel('A', 12.5, false);
    
    const channels = controller.getChannels();
    const channelA = channels.find(c => c.channel === 'A');
    
    expect(channelA).toBeDefined();
    if (channelA) {
      expect(channelA.currentAmps).toBe(12.5);
      expect(channelA.overload).toBe(false);
      expect(channelA.relayActive).toBe(true);
    }
  });

  test('should handle overload state correctly', () => {
    controller.updateChannel('B', 16.0, true);
    
    const channels = controller.getChannels();
    const channelB = channels.find(c => c.channel === 'B');
    
    expect(channelB).toBeDefined();
    if (channelB) {
      expect(channelB.overload).toBe(true);
      expect(channelB.relayActive).toBe(false); // Relay should be off when overload
    }
  });

  test('should reset system state correctly', () => {
    controller.updateChannel('C', 18.0, true);
    controller.resetSystem();
    
    const channels = controller.getChannels();
    const channelC = channels.find(c => c.channel === 'C');
    
    expect(channelC).toBeDefined();
    if (channelC) {
      expect(channelC.overload).toBe(false);
      expect(channelC.relayActive).toBe(true);
    }
  });

  test('should set relay state correctly', () => {
    controller.setRelayState('A', false);
    
    const channels = controller.getChannels();
    const channelA = channels.find(c => c.channel === 'A');
    
    expect(channelA).toBeDefined();
    if (channelA) {
      expect(channelA.relayActive).toBe(false);
    }
  });
});