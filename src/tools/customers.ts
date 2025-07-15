import { z } from 'zod';
import type { Customer } from '../types/index.js';
import type { MiteApiClient } from '../utils/api-client.js';

const listCustomersSchema = z.object({
  name: z.string().optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  archived: z.coerce.boolean().optional(),
});

const createCustomerSchema = z.object({
  name: z.string(),
  note: z.string().optional(),
  archived: z.coerce.boolean().optional(),
  hourly_rate: z.coerce.number().optional(),
  hourly_rates_per_service: z
    .array(
      z.object({
        service_id: z.coerce.number(),
        hourly_rate: z.coerce.number(),
      })
    )
    .optional(),
});

const updateCustomerSchema = z.object({
  id: z.coerce.number(),
  name: z.string().optional(),
  note: z.string().optional(),
  archived: z.coerce.boolean().optional(),
  hourly_rate: z.coerce.number().optional(),
  hourly_rates_per_service: z
    .array(
      z.object({
        service_id: z.coerce.number(),
        hourly_rate: z.coerce.number(),
      })
    )
    .optional(),
});

const getCustomerSchema = z.object({
  id: z.coerce.number(),
});

const deleteCustomerSchema = z.object({
  id: z.coerce.number(),
});

export function createCustomersTools(apiClient: MiteApiClient) {
  return {
    listCustomers: {
      name: 'list_customers',
      description: 'List active or archived customers',
      inputSchema: listCustomersSchema,
      execute: async (input: z.infer<typeof listCustomersSchema>) => {
        const { archived, ...params } = input;
        const path = archived ? '/customers/archived.json' : '/customers.json';
        const customers = await apiClient.get<Customer[]>(path, params);
        return { customers };
      },
    },

    getCustomer: {
      name: 'get_customer',
      description: 'Get a specific customer by ID',
      inputSchema: getCustomerSchema,
      execute: async (input: z.infer<typeof getCustomerSchema>) => {
        const response = await apiClient.get<{ customer: Customer }>(`/customers/${input.id}.json`);
        return response.customer;
      },
    },

    createCustomer: {
      name: 'create_customer',
      description: 'Create a new customer (requires admin permissions)',
      inputSchema: createCustomerSchema,
      execute: async (input: z.infer<typeof createCustomerSchema>) => {
        const response = await apiClient.post<{ customer: Customer }>('/customers.json', {
          customer: input,
        });
        return response.customer;
      },
    },

    updateCustomer: {
      name: 'update_customer',
      description: 'Update an existing customer (requires admin permissions)',
      inputSchema: updateCustomerSchema,
      execute: async (input: z.infer<typeof updateCustomerSchema>) => {
        const { id, ...data } = input;
        const response = await apiClient.patch<{ customer: Customer }>(`/customers/${id}.json`, {
          customer: data,
        });
        return response.customer;
      },
    },

    deleteCustomer: {
      name: 'delete_customer',
      description: 'Delete a customer (requires admin permissions, customer must have no projects)',
      inputSchema: deleteCustomerSchema,
      execute: async (input: z.infer<typeof deleteCustomerSchema>) => {
        await apiClient.delete(`/customers/${input.id}.json`);
        return { success: true, id: input.id };
      },
    },
  };
}
