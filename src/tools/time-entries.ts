import { z } from 'zod';
import type { GroupedTimeEntry, TimeEntry } from '../types/index.js';
import type { MiteApiClient } from '../utils/api-client.js';
import { optionalBoolean, optionalNumber, requiredNumber } from '../utils/validation.js';

const listTimeEntriesSchema = z.object({
  user_id: optionalNumber,
  customer_id: optionalNumber,
  project_id: optionalNumber,
  service_id: optionalNumber,
  from: z.string().optional(),
  to: z.string().optional(),
  billable: optionalBoolean,
  locked: optionalBoolean,
  limit: optionalNumber,
  page: optionalNumber,
  group_by: z
    .enum(['customer', 'project', 'service', 'user', 'day', 'week', 'month', 'year'])
    .optional(),
});

const createTimeEntrySchema = z.object({
  date_at: z.string().optional(),
  minutes: optionalNumber,
  note: z.string().optional(),
  user_id: optionalNumber,
  project_id: optionalNumber,
  service_id: optionalNumber,
  locked: optionalBoolean,
});

const updateTimeEntrySchema = z
  .object({
    id: requiredNumber.optional(),
    time_entry_id: requiredNumber.optional(),
    date_at: z.string().optional(),
    minutes: optionalNumber,
    note: z.string().optional(),
    user_id: optionalNumber,
    project_id: optionalNumber,
    service_id: optionalNumber,
    locked: optionalBoolean,
  })
  .refine(data => data.id || data.time_entry_id, {
    message: "Either 'id' or 'time_entry_id' must be provided",
  });

const getDailyTimeEntriesSchema = z.object({
  at: z.string().optional().describe('Date in YYYY-MM-DD format'),
});

const getTimeEntrySummarySchema = z.object({
  group_by: z.enum(['customer', 'project', 'service', 'user']),
  from: z.string().optional(),
  to: z.string().optional(),
  user_id: optionalNumber,
  customer_id: optionalNumber,
  project_id: optionalNumber,
  service_id: optionalNumber,
});

const getTimeEntrySchema = z.object({
  id: requiredNumber,
});

const deleteTimeEntrySchema = z.object({
  id: requiredNumber,
});

export function createTimeEntriesTools(apiClient: MiteApiClient) {
  return {
    listTimeEntries: {
      name: 'list_time_entries',
      description:
        "List time entries with filters. IMPORTANT: Always use specific filters when available (user_id, project_id, customer_id) to avoid large result sets. When a user mentions a specific person, project, or customer, include those IDs as filters. Use getDailyTimeEntries for current user's today entries. To see totals by customer/project/user, use group_by parameter (e.g., group_by: 'customer' or 'project' or 'user').",
      inputSchema: listTimeEntriesSchema,
      execute: async (input: z.infer<typeof listTimeEntriesSchema>) => {
        const { group_by, limit, ...params } = input;

        const path = group_by ? `/time_entries.json?group_by=${group_by}` : '/time_entries.json';

        if (group_by) {
          // When grouping, don't apply limit as we're getting aggregated totals
          const entries = await apiClient.get<GroupedTimeEntry[]>(path, params);
          return { entries, grouped: true, group_by };
        } else {
          // Apply a reasonable default limit if none specified for non-grouped queries
          const effectiveLimit = limit || 500;
          const queryParams = { ...params, limit: effectiveLimit };
          const entries = await apiClient.get<TimeEntry[]>(path, queryParams);

          // Warn if we hit the limit
          if (entries.length === effectiveLimit) {
            return {
              entries,
              grouped: false,
              warning: `Result set limited to ${effectiveLimit} entries. Use more specific filters (user_id, project_id, customer_id) to see all relevant entries.`,
            };
          }

          return { entries, grouped: false };
        }
      },
    },

    getDailyTimeEntries: {
      name: 'get_daily_time_entries',
      description:
        'Get time entries for today or a specific date for the current user. USE THIS for "my time entries" or when no specific user is mentioned.',
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
        const { id, time_entry_id, ...data } = input;
        const entryId = id || time_entry_id;
        const response = await apiClient.patch<{ time_entry: TimeEntry }>(
          `/time_entries/${entryId}.json`,
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

    getTimeEntrySummary: {
      name: 'get_time_entry_summary',
      description:
        'Get summarized/grouped time entries by customer, project, service, or user. Use this when you need totals or summaries rather than individual entries.',
      inputSchema: getTimeEntrySummarySchema,
      execute: async (input: z.infer<typeof getTimeEntrySummarySchema>) => {
        const { group_by, ...params } = input;
        const path = `/time_entries.json?group_by=${group_by}`;
        const entries = await apiClient.get<GroupedTimeEntry[]>(path, params);
        return {
          entries,
          grouped: true,
          group_by,
          summary: `Time entries grouped by ${group_by}`,
        };
      },
    },
  };
}
