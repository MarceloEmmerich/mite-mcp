import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectsTools } from '../../tools/projects.js';
import type { Project } from '../../types/index.js';
import { MiteApiClient } from '../../utils/api-client.js';

vi.mock('../../utils/api-client.js');

describe('Projects Tools', () => {
  let apiClient: MiteApiClient;
  let tools: ReturnType<typeof createProjectsTools>;

  beforeEach(() => {
    apiClient = new MiteApiClient({ accountName: 'test', apiKey: 'test-key' });
    tools = createProjectsTools(apiClient);
    vi.clearAllMocks();
  });

  describe('listProjects', () => {
    it('should list active projects', async () => {
      const mockProjects: Project[] = [
        { id: 1, name: 'Project Alpha', customer_id: 123, archived: false },
        { id: 2, name: 'Project Beta', customer_id: 456, archived: false },
      ];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockProjects);

      const result = await tools.listProjects.execute({
        name: 'Project',
        customer_id: 123,
        limit: 20,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/projects.json', {
        name: 'Project',
        customer_id: 123,
        limit: 20,
      });
      expect(result).toEqual({ projects: mockProjects });
    });

    it('should list archived projects', async () => {
      const mockProjects: Project[] = [{ id: 3, name: 'Old Project', archived: true }];

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockProjects);

      const result = await tools.listProjects.execute({
        archived: true,
        page: 2,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/projects/archived.json', {
        page: 2,
      });
      expect(result).toEqual({ projects: mockProjects });
    });
  });

  describe('getProject', () => {
    it('should get a specific project', async () => {
      const mockProject: Project = {
        id: 789,
        name: 'Important Project',
        customer_id: 123,
        customer_name: 'Big Client',
        budget: 50000,
        hourly_rate: 150,
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ project: mockProject });

      const result = await tools.getProject.execute({ id: 789 });

      expect(apiClient.get).toHaveBeenCalledWith('/projects/789.json');
      expect(result).toEqual(mockProject);
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const newProject = {
        name: 'New Project',
        customer_id: 123,
        budget: 10000,
        hourly_rate: 120,
        note: 'Important project for Q1',
      };

      const mockCreatedProject: Project = {
        id: 999,
        ...newProject,
        created_at: '2024-01-15T10:00:00Z',
      };

      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ project: mockCreatedProject });

      const result = await tools.createProject.execute(newProject);

      expect(apiClient.post).toHaveBeenCalledWith('/projects.json', {
        project: newProject,
      });
      expect(result).toEqual(mockCreatedProject);
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      const updateData = {
        id: 789,
        name: 'Updated Project Name',
        budget: 75000,
        update_hourly_rate_on_time_entries: true,
      };

      const mockUpdatedProject: Project = {
        id: 789,
        name: 'Updated Project Name',
        customer_id: 123,
        budget: 75000,
        hourly_rate: 150,
        updated_at: '2024-01-15T11:00:00Z',
      };

      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({ project: mockUpdatedProject });

      const result = await tools.updateProject.execute(updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/projects/789.json', {
        project: {
          name: 'Updated Project Name',
          budget: 75000,
          update_hourly_rate_on_time_entries: true,
        },
      });
      expect(result).toEqual(mockUpdatedProject);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce(undefined);

      const result = await tools.deleteProject.execute({ id: 789 });

      expect(apiClient.delete).toHaveBeenCalledWith('/projects/789.json');
      expect(result).toEqual({ success: true, id: 789 });
    });
  });
});
