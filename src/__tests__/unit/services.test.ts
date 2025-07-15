import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createServicesTools } from '../../tools/services.js';
import type { Service } from '../../types/index.js';
import { MiteApiClient } from '../../utils/api-client.js';

vi.mock('../../utils/api-client.js');

describe('Services Tools', () => {
  let apiClient: MiteApiClient;
  let tools: ReturnType<typeof createServicesTools>;

  beforeEach(() => {
    apiClient = new MiteApiClient({ accountName: 'test', apiKey: 'test-key' });
    tools = createServicesTools(apiClient);
    vi.clearAllMocks();
  });

  describe('listServices', () => {
    it('should list active services', async () => {
      const mockServices: Service[] = [
        { id: 1, name: 'Development', hourly_rate: 120, billable: true, archived: false },
        { id: 2, name: 'Consulting', hourly_rate: 150, billable: true, archived: false },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockServices);

      const result = await tools.listServices.execute({
        name: 'Dev',
        limit: 10,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/services.json', {
        name: 'Dev',
        limit: 10,
      });
      expect(result).toEqual({ services: mockServices });
    });

    it('should list archived services', async () => {
      const mockServices: Service[] = [{ id: 3, name: 'Old Service', archived: true }];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockServices);

      const result = await tools.listServices.execute({
        archived: true,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/services/archived.json', {});
      expect(result).toEqual({ services: mockServices });
    });
  });

  describe('getService', () => {
    it('should get a specific service', async () => {
      const mockService: Service = {
        id: 456,
        name: 'Premium Support',
        hourly_rate: 200,
        billable: true,
        note: 'High priority support',
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ service: mockService });

      const result = await tools.getService.execute({ id: 456 });

      expect(apiClient.get).toHaveBeenCalledWith('/services/456.json');
      expect(result).toEqual(mockService);
    });
  });

  describe('createService', () => {
    it('should create a new service', async () => {
      const newService = {
        name: 'New Service',
        hourly_rate: 100,
        billable: true,
        note: 'Standard development service',
      };

      const mockCreatedService: Service = {
        id: 999,
        ...newService,
        created_at: '2024-01-15T10:00:00Z',
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ service: mockCreatedService });

      const result = await tools.createService.execute(newService);

      expect(apiClient.post).toHaveBeenCalledWith('/services.json', {
        service: newService,
      });
      expect(result).toEqual(mockCreatedService);
    });
  });

  describe('updateService', () => {
    it('should update an existing service', async () => {
      const updateData = {
        id: 456,
        name: 'Updated Service Name',
        hourly_rate: 180,
        update_hourly_rate_on_time_entries: true,
      };

      const mockUpdatedService: Service = {
        id: 456,
        name: 'Updated Service Name',
        hourly_rate: 180,
        billable: true,
        updated_at: '2024-01-15T11:00:00Z',
      };

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ service: mockUpdatedService });

      const result = await tools.updateService.execute(updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/services/456.json', {
        service: {
          name: 'Updated Service Name',
          hourly_rate: 180,
          update_hourly_rate_on_time_entries: true,
        },
      });
      expect(result).toEqual(mockUpdatedService);
    });
  });

  describe('deleteService', () => {
    it('should delete a service', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined);

      const result = await tools.deleteService.execute({ id: 456 });

      expect(apiClient.delete).toHaveBeenCalledWith('/services/456.json');
      expect(result).toEqual({ success: true, id: 456 });
    });
  });
});
