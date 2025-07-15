import { z } from 'zod';
import type { TimeEntry } from '../types/index.js';
import type { MiteApiClient } from '../utils/api-client.js';
import { optionalNumber, requiredNumber } from '../utils/validation.js';

interface StopwatchStatus {
  tracking_time_entry?: TimeEntry & {
    tracking_started_at?: string;
    tracking_since?: string;
  };
  stopped_time_entry?: TimeEntry;
}

const startStopwatchSchema = z.object({
  id: requiredNumber.describe('ID of the time entry to start tracking'),
});

const stopStopwatchSchema = z.object({
  id: requiredNumber.describe('ID of the time entry that is currently being tracked'),
});

const quickStartStopwatchSchema = z.object({
  note: z.string().optional(),
  project_id: optionalNumber,
  service_id: optionalNumber,
});

export function createStopwatchTools(apiClient: MiteApiClient) {
  return {
    getStopwatchStatus: {
      name: 'get_stopwatch_status',
      description: 'Get the current stopwatch status (running or stopped time entry)',
      inputSchema: z.object({}),
      execute: async () => {
        const response = await apiClient.get<StopwatchStatus>('/tracker.json');
        return response;
      },
    },

    startStopwatch: {
      name: 'start_stopwatch',
      description: 'Start the stopwatch for a time entry',
      inputSchema: startStopwatchSchema,
      execute: async (input: z.infer<typeof startStopwatchSchema>) => {
        const response = await apiClient.patch<{ tracking_time_entry: TimeEntry }>(
          `/tracker/${input.id}.json`,
          {}
        );
        return response.tracking_time_entry;
      },
    },

    stopStopwatch: {
      name: 'stop_stopwatch',
      description: 'Stop the currently running stopwatch',
      inputSchema: stopStopwatchSchema,
      execute: async (input: z.infer<typeof stopStopwatchSchema>) => {
        await apiClient.delete(`/tracker/${input.id}.json`);
        return { success: true, stopped_id: input.id };
      },
    },

    quickStartStopwatch: {
      name: 'quick_start_stopwatch',
      description: 'Start stopwatch with a new time entry for today',
      inputSchema: quickStartStopwatchSchema,
      execute: async (input: z.infer<typeof quickStartStopwatchSchema>) => {
        const timeEntry = await apiClient.post<{ time_entry: TimeEntry }>('/time_entries.json', {
          time_entry: {
            date_at: new Date().toISOString().split('T')[0],
            minutes: 0,
            ...input,
          },
        });

        const tracking = await apiClient.patch<{ tracking_time_entry: TimeEntry }>(
          `/tracker/${timeEntry.time_entry.id}.json`,
          {}
        );

        return tracking.tracking_time_entry;
      },
    },
  };
}
