import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomersTools } from '../../tools/customers.js';
import type { Customer } from '../../types/index.js';
import { MiteApiClient } from '../../utils/api-client.js';

vi.mock('../../utils/api-client.js');

describe('Customers Tools', () => {
  let apiClient: MiteApiClient;
  let tools: ReturnType<typeof createCustomersTools>;

  beforeEach(() => {
    apiClient = new MiteApiClient({ accountName: 'test', apiKey: 'test-key' });
    tools = createCustomersTools(apiClient);
    vi.clearAllMocks();
  });

  describe('listCustomers', () => {
    it('should list active customers', async () => {
      const mockCustomers: Customer[] = [
        { id: 1, name: 'Customer 1', archived: false },
        { id: 2, name: 'Customer 2', archived: false },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockCustomers);

      const result = await tools.listCustomers.execute({
        name: 'Customer',
        limit: 10,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/customers.json', {
        name: 'Customer',
        limit: 10,
      });
      expect(result).toEqual({ customers: mockCustomers });
    });

    it('should list archived customers', async () => {
      const mockCustomers: Customer[] = [{ id: 3, name: 'Archived Customer', archived: true }];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockCustomers);

      const result = await tools.listCustomers.execute({
        archived: true,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/customers/archived.json', {});
      expect(result).toEqual({ customers: mockCustomers });
    });
  });

  describe('getCustomer', () => {
    it('should get a specific customer', async () => {
      const mockCustomer: Customer = {
        id: 123,
        name: 'Test Customer',
        note: 'Important client',
        hourly_rate: 100,
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ customer: mockCustomer });

      const result = await tools.getCustomer.execute({ id: 123 });

      expect(apiClient.get).toHaveBeenCalledWith('/customers/123.json');
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const newCustomer = {
        name: 'New Customer',
        note: 'Just signed up',
        hourly_rate: 150,
      };

      const mockCreatedCustomer: Customer = {
        id: 999,
        ...newCustomer,
        created_at: '2024-01-15T10:00:00Z',
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ customer: mockCreatedCustomer });

      const result = await tools.createCustomer.execute(newCustomer);

      expect(apiClient.post).toHaveBeenCalledWith('/customers.json', {
        customer: newCustomer,
      });
      expect(result).toEqual(mockCreatedCustomer);
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const updateData = {
        id: 123,
        name: 'Updated Customer Name',
        hourly_rate: 200,
      };

      const mockUpdatedCustomer: Customer = {
        id: 123,
        name: 'Updated Customer Name',
        hourly_rate: 200,
        note: 'Important client',
        updated_at: '2024-01-15T11:00:00Z',
      };

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ customer: mockUpdatedCustomer });

      const result = await tools.updateCustomer.execute(updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/customers/123.json', {
        customer: {
          name: 'Updated Customer Name',
          hourly_rate: 200,
        },
      });
      expect(result).toEqual(mockUpdatedCustomer);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined);

      const result = await tools.deleteCustomer.execute({ id: 123 });

      expect(apiClient.delete).toHaveBeenCalledWith('/customers/123.json');
      expect(result).toEqual({ success: true, id: 123 });
    });
  });
});
