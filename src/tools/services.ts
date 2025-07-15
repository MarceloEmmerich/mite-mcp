import { z } from 'zod';
import type { Service } from '../types/index.js';
import type { MiteApiClient } from '../utils/api-client.js';
import { optionalBoolean, optionalNumber, requiredNumber } from '../utils/validation.js';

const listServicesSchema = z.object({
  name: z.string().optional(),
  limit: optionalNumber,
  page: optionalNumber,
  archived: optionalBoolean,
});

const createServiceSchema = z.object({
  name: z.string(),
  note: z.string().optional(),
  hourly_rate: optionalNumber,
  billable: optionalBoolean,
  archived: optionalBoolean,
});

const updateServiceSchema = z.object({
  id: requiredNumber,
  name: z.string().optional(),
  note: z.string().optional(),
  hourly_rate: optionalNumber,
  billable: optionalBoolean,
  archived: optionalBoolean,
  update_hourly_rate_on_time_entries: optionalBoolean,
});

const getServiceSchema = z.object({
  id: requiredNumber,
});

const deleteServiceSchema = z.object({
  id: requiredNumber,
});

export function createServicesTools(apiClient: MiteApiClient) {
  return {
    listServices: {
      name: 'list_services',
      description: 'List active or archived services',
      inputSchema: listServicesSchema,
      execute: async (input: z.infer<typeof listServicesSchema>) => {
        const { archived, ...params } = input;
        const path = archived ? '/services/archived.json' : '/services.json';
        const services = await apiClient.get<Service[]>(path, params);
        return { services };
      },
    },

    getService: {
      name: 'get_service',
      description: 'Get a specific service by ID',
      inputSchema: getServiceSchema,
      execute: async (input: z.infer<typeof getServiceSchema>) => {
        const response = await apiClient.get<{ service: Service }>(`/services/${input.id}.json`);
        return response.service;
      },
    },

    createService: {
      name: 'create_service',
      description: 'Create a new service (requires admin permissions)',
      inputSchema: createServiceSchema,
      execute: async (input: z.infer<typeof createServiceSchema>) => {
        const response = await apiClient.post<{ service: Service }>('/services.json', {
          service: input,
        });
        return response.service;
      },
    },

    updateService: {
      name: 'update_service',
      description: 'Update an existing service (requires admin permissions)',
      inputSchema: updateServiceSchema,
      execute: async (input: z.infer<typeof updateServiceSchema>) => {
        const { id, ...data } = input;
        const response = await apiClient.patch<{ service: Service }>(`/services/${id}.json`, {
          service: data,
        });
        return response.service;
      },
    },

    deleteService: {
      name: 'delete_service',
      description:
        'Delete a service (requires admin permissions, service must have no time entries)',
      inputSchema: deleteServiceSchema,
      execute: async (input: z.infer<typeof deleteServiceSchema>) => {
        await apiClient.delete(`/services/${input.id}.json`);
        return { success: true, id: input.id };
      },
    },
  };
}
