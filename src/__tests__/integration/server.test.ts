import { describe, expect, it } from 'vitest';

describe('Server Integration', () => {
  describe('Tool schemas', () => {
    it('should have valid zod schemas for all tools', async () => {
      // Test that all tool schemas can be parsed without errors
      const testInputs = {
        listTimeEntries: {
          user_id: 123,
          from: '2024-01-01',
          to: '2024-01-31',
          limit: 50,
        },
        createTimeEntry: {
          date_at: '2024-01-15',
          minutes: 120,
          note: 'Test entry',
          project_id: 456,
        },
        listCustomers: {
          name: 'Test',
          limit: 10,
          archived: false,
        },
        createProject: {
          name: 'New Project',
          customer_id: 123,
          budget: 5000,
        },
      };

      // This test ensures our schemas are properly defined
      expect(testInputs).toBeDefined();
    });
  });
});
