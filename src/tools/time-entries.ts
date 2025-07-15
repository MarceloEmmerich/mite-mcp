import { z } from 'zod';
import type { GroupedTimeEntry, TimeEntry } from '../types/index.js';
import type { MiteApiClient } from '../utils/api-client.js';

const listTimeEntriesSchema = z.object({
  user_id: z.coerce.number().optional(),
  customer_id: z.coerce.number().optional(),
  project_id: z.coerce.number().optional(),
  service_id: z.coerce.number().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  billable: z.coerce.boolean().optional(),
  locked: z.coerce.boolean().optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  group_by: z
    .enum(['customer', 'project', 'service', 'user', 'day', 'week', 'month', 'year'])
    .optional(),
});

const createTimeEntrySchema = z.object({
  date_at: z.string().optional(),
  minutes: z.coerce.number().optional(),
  note: z.string().optional(),
  user_id: z.coerce.number().optional(),
  project_id: z.coerce.number().optional(),
  service_id: z.coerce.number().optional(),
  locked: z.coerce.boolean().optional(),
});

const updateTimeEntrySchema = z.object({
  id: z.coerce.number(),
  date_at: z.string().optional(),
  minutes: z.coerce.number().optional(),
  note: z.string().optional(),
  user_id: z.coerce.number().optional(),
  project_id: z.coerce.number().optional(),
  service_id: z.coerce.number().optional(),
  locked: z.coerce.boolean().optional(),
});

const getDailyTimeEntriesSchema = z.object({
  at: z.string().optional().describe('Date in YYYY-MM-DD format'),
});

const getTimeEntrySchema = z.object({
  id: z.coerce.number(),
});

const deleteTimeEntrySchema = z.object({
  id: z.coerce.number(),
});

export function createTimeEntriesTools(apiClient: MiteApiClient) {
  return {
    listTimeEntries: {
      name: 'list_time_entries',
      description: 'List time entries with optional filters',
      inputSchema: listTimeEntriesSchema,
      execute: async (input: z.infer<typeof listTimeEntriesSchema>) => {
        const { group_by, ...params } = input;
        const path = group_by ? `/time_entries.json?group_by=${group_by}` : '/time_entries.json';

        if (group_by) {
          const entries = await apiClient.get<GroupedTimeEntry[]>(path, params);
          return { entries, grouped: true, group_by };
        } else {
          const entries = await apiClient.get<TimeEntry[]>(path, params);
          return { entries, grouped: false };
        }
      },
    },

    getDailyTimeEntries: {
      name: 'get_daily_time_entries',
      description: 'Get time entries for today or a specific date for the current user',
      inputSchema: getDailyTimeEntriesSchema,
      execute: async (input: z.infer<typeof getDailyTimeEntriesSchema>) => {
        const path = '/daily.json';
        const entries = await apiClient.get<TimeEntry[]>(
          path,
          input.at ? { at: input.at } : undefined
        );
        return { entries };
      },
    },

    getTimeEntry: {
      name: 'get_time_entry',
      description: 'Get a specific time entry by ID',
      inputSchema: getTimeEntrySchema,
      execute: async (input: z.infer<typeof getTimeEntrySchema>) => {
        const entry = await apiClient.get<{ time_entry: TimeEntry }>(
          `/time_entries/${input.id}.json`
        );
        return entry.time_entry;
      },
    },

    createTimeEntry: {
      name: 'create_time_entry',
      description: 'Create a new time entry',
      inputSchema: createTimeEntrySchema,
      execute: async (input: z.infer<typeof createTimeEntrySchema>) => {
        const response = await apiClient.post<{ time_entry: TimeEntry }>('/time_entries.json', {
          time_entry: input,
        });
        return response.time_entry;
      },
    },

    updateTimeEntry: {
      name: 'update_time_entry',
      description: 'Update an existing time entry',
      inputSchema: updateTimeEntrySchema,
      execute: async (input: z.infer<typeof updateTimeEntrySchema>) => {
        const { id, ...data } = input;
        const response = await apiClient.patch<{ time_entry: TimeEntry }>(
          `/time_entries/${id}.json`,
          {
            time_entry: data,
          }
        );
        return response.time_entry;
      },
    },

    deleteTimeEntry: {
      name: 'delete_time_entry',
      description: 'Delete a time entry',
      inputSchema: deleteTimeEntrySchema,
      execute: async (input: z.infer<typeof deleteTimeEntrySchema>) => {
        await apiClient.delete(`/time_entries/${input.id}.json`);
        return { success: true, id: input.id };
      },
    },
  };
}
