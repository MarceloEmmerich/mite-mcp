import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStopwatchTools } from '../../tools/stopwatch.js';
import type { TimeEntry } from '../../types/index.js';
import { MiteApiClient } from '../../utils/api-client.js';

vi.mock('../../utils/api-client.js');

describe('Stopwatch Tools', () => {
  let apiClient: MiteApiClient;
  let tools: ReturnType<typeof createStopwatchTools>;

  beforeEach(() => {
    apiClient = new MiteApiClient({ accountName: 'test', apiKey: 'test-key' });
    tools = createStopwatchTools(apiClient);
    vi.clearAllMocks();
  });

  describe('getStopwatchStatus', () => {
    it('should get stopwatch status with running timer', async () => {
      const mockStatus = {
        tracking_time_entry: {
          id: 123,
          minutes: 45,
          note: 'Running entry',
          tracking_started_at: '2024-01-15T10:00:00Z',
          tracking_since: '45 minutes',
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockStatus);

      const result = await tools.getStopwatchStatus.execute();

      expect(apiClient.get).toHaveBeenCalledWith('/tracker.json');
      expect(result).toEqual(mockStatus);
    });

    it('should get stopwatch status with stopped timer', async () => {
      const mockStatus = {
        stopped_time_entry: {
          id: 456,
          minutes: 120,
          note: 'Stopped entry',
        },
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockStatus);

      const result = await tools.getStopwatchStatus.execute();

      expect(apiClient.get).toHaveBeenCalledWith('/tracker.json');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('startStopwatch', () => {
    it('should start stopwatch for a time entry', async () => {
      const mockEntry: TimeEntry = {
        id: 123,
        minutes: 0,
        note: 'Starting timer',
      };

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ tracking_time_entry: mockEntry });

      const result = await tools.startStopwatch.execute({ id: 123 });

      expect(apiClient.patch).toHaveBeenCalledWith('/tracker/123.json', {});
      expect(result).toEqual(mockEntry);
    });
  });

  describe('stopStopwatch', () => {
    it('should stop the running stopwatch', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined);

      const result = await tools.stopStopwatch.execute({ id: 123 });

      expect(apiClient.delete).toHaveBeenCalledWith('/tracker/123.json');
      expect(result).toEqual({ success: true, stopped_id: 123 });
    });
  });

  describe('quickStartStopwatch', () => {
    it('should create new entry and start stopwatch', async () => {
      const currentDate = '2024-01-15';
      vi.spyOn(global, 'Date').mockImplementation(
        () =>
          ({
            toISOString: () => `${currentDate}T12:00:00.000Z`,
            // biome-ignore lint/suspicious/noExplicitAny: Mock Date object
          }) as any
      );

      const mockCreatedEntry: TimeEntry = {
        id: 999,
        date_at: currentDate,
        minutes: 0,
        note: 'Quick start',
        project_id: 456,
      };

      const mockTrackingEntry: TimeEntry = {
        ...mockCreatedEntry,
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ time_entry: mockCreatedEntry });
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        tracking_time_entry: mockTrackingEntry,
      });

      const result = await tools.quickStartStopwatch.execute({
        note: 'Quick start',
        project_id: 456,
      });

      expect(apiClient.post).toHaveBeenCalledWith('/time_entries.json', {
        time_entry: {
          date_at: currentDate,
          minutes: 0,
          note: 'Quick start',
          project_id: 456,
        },
      });
      expect(apiClient.patch).toHaveBeenCalledWith('/tracker/999.json', {});
      expect(result).toEqual(mockTrackingEntry);
    });

    it('should create entry without optional fields', async () => {
      const currentDate = '2024-01-15';
      vi.spyOn(global, 'Date').mockImplementation(
        () =>
          ({
            toISOString: () => `${currentDate}T12:00:00.000Z`,
            // biome-ignore lint/suspicious/noExplicitAny: Mock Date object
          }) as any
      );

      const mockCreatedEntry: TimeEntry = {
        id: 999,
        date_at: currentDate,
        minutes: 0,
      };

      const mockTrackingEntry: TimeEntry = {
        ...mockCreatedEntry,
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ time_entry: mockCreatedEntry });
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        tracking_time_entry: mockTrackingEntry,
      });

      const result = await tools.quickStartStopwatch.execute({});

      expect(apiClient.post).toHaveBeenCalledWith('/time_entries.json', {
        time_entry: {
          date_at: currentDate,
          minutes: 0,
        },
      });
      expect(result).toEqual(mockTrackingEntry);
    });
  });
});
