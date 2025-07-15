import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTimeEntriesTools } from '../../tools/time-entries.js';
import type { GroupedTimeEntry, TimeEntry } from '../../types/index.js';
import { MiteApiClient } from '../../utils/api-client.js';

vi.mock('../../utils/api-client.js');

describe('Time Entries Tools', () => {
  let apiClient: MiteApiClient;
  let tools: ReturnType<typeof createTimeEntriesTools>;

  beforeEach(() => {
    apiClient = new MiteApiClient({ accountName: 'test', apiKey: 'test-key' });
    tools = createTimeEntriesTools(apiClient);
    vi.clearAllMocks();
  });

  describe('listTimeEntries', () => {
    it('should list time entries without grouping', async () => {
      const mockEntries: TimeEntry[] = [
        { id: 1, minutes: 60, note: 'Test entry 1' },
        { id: 2, minutes: 120, note: 'Test entry 2' },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockEntries);

      const result = await tools.listTimeEntries.execute({
        user_id: 123,
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/time_entries.json', {
        user_id: 123,
        from: '2024-01-01',
        to: '2024-01-31',
        limit: 500,
      });
      expect(result).toEqual({ entries: mockEntries, grouped: false });
    });

    it('should list time entries with grouping', async () => {
      const mockGroupedEntries: GroupedTimeEntry[] = [
        { minutes: 180, user_id: 123, user_name: 'Test User' },
        { minutes: 240, user_id: 456, user_name: 'Another User' },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockGroupedEntries);

      const result = await tools.listTimeEntries.execute({
        group_by: 'user',
        from: '2024-01-01',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/time_entries.json?group_by=user', {
        from: '2024-01-01',
      });
      expect(result).toEqual({
        entries: mockGroupedEntries,
        grouped: true,
        group_by: 'user',
      });
    });

    it('should return warning when hitting limit', async () => {
      // Create exactly 500 entries to trigger the warning
      const mockEntries: TimeEntry[] = Array(500)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          minutes: 60,
          note: `Entry ${i + 1}`,
        }));

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockEntries);

      const result = await tools.listTimeEntries.execute({
        from: '2024-01-01',
        to: '2024-12-31',
      });

      expect(result).toEqual({
        entries: mockEntries,
        grouped: false,
        warning:
          'Result set limited to 500 entries. Use more specific filters (user_id, project_id, customer_id) to see all relevant entries.',
      });
    });
  });

  describe('getDailyTimeEntries', () => {
    it('should get daily entries for today when no date specified', async () => {
      const mockEntries: TimeEntry[] = [{ id: 1, minutes: 60, note: 'Today entry' }];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockEntries);

      const result = await tools.getDailyTimeEntries.execute({});

      expect(apiClient.get).toHaveBeenCalledWith('/daily.json', undefined);
      expect(result).toEqual({ entries: mockEntries });
    });

    it('should get daily entries for specific date', async () => {
      const mockEntries: TimeEntry[] = [{ id: 1, minutes: 60, note: 'Specific date entry' }];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockEntries);

      const result = await tools.getDailyTimeEntries.execute({ at: '2024-01-15' });

      expect(apiClient.get).toHaveBeenCalledWith('/daily.json', { at: '2024-01-15' });
      expect(result).toEqual({ entries: mockEntries });
    });
  });

  describe('getTimeEntry', () => {
    it('should get a specific time entry', async () => {
      const mockEntry: TimeEntry = {
        id: 123,
        minutes: 90,
        note: 'Specific entry',
        project_id: 456,
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ time_entry: mockEntry });

      const result = await tools.getTimeEntry.execute({ id: 123 });

      expect(apiClient.get).toHaveBeenCalledWith('/time_entries/123.json');
      expect(result).toEqual(mockEntry);
    });
  });

  describe('createTimeEntry', () => {
    it('should create a new time entry', async () => {
      const newEntry = {
        date_at: '2024-01-15',
        minutes: 120,
        note: 'New entry',
        project_id: 789,
      };

      const mockCreatedEntry: TimeEntry = {
        id: 999,
        ...newEntry,
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ time_entry: mockCreatedEntry });

      const result = await tools.createTimeEntry.execute(newEntry);

      expect(apiClient.post).toHaveBeenCalledWith('/time_entries.json', {
        time_entry: newEntry,
      });
      expect(result).toEqual(mockCreatedEntry);
    });
  });

  describe('updateTimeEntry', () => {
    it('should update an existing time entry', async () => {
      const updateData = {
        id: 123,
        minutes: 150,
        note: 'Updated entry',
      };

      const mockUpdatedEntry: TimeEntry = {
        id: 123,
        minutes: 150,
        note: 'Updated entry',
        project_id: 456,
      };

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ time_entry: mockUpdatedEntry });

      const result = await tools.updateTimeEntry.execute(updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/time_entries/123.json', {
        time_entry: {
          minutes: 150,
          note: 'Updated entry',
        },
      });
      expect(result).toEqual(mockUpdatedEntry);
    });
  });

  describe('deleteTimeEntry', () => {
    it('should delete a time entry', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined);

      const result = await tools.deleteTimeEntry.execute({ id: 123 });

      expect(apiClient.delete).toHaveBeenCalledWith('/time_entries/123.json');
      expect(result).toEqual({ success: true, id: 123 });
    });
  });

  describe('getTimeEntrySummary', () => {
    it('should get time entry summary grouped by customer', async () => {
      const mockGroupedEntries: GroupedTimeEntry[] = [
        { minutes: 480, customer_id: 1, customer_name: 'Customer A' },
        { minutes: 360, customer_id: 2, customer_name: 'Customer B' },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockGroupedEntries);

      const result = await tools.getTimeEntrySummary.execute({
        group_by: 'customer',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/time_entries.json?group_by=customer', {
        from: '2024-01-01',
        to: '2024-01-31',
      });
      expect(result).toEqual({
        entries: mockGroupedEntries,
        grouped: true,
        group_by: 'customer',
        summary: 'Time entries grouped by customer',
      });
    });
  });
});
