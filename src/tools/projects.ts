import { z } from 'zod';
import type { Project } from '../types/index.js';
import type { MiteApiClient } from '../utils/api-client.js';

const listProjectsSchema = z.object({
  name: z.string().optional(),
  customer_id: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  archived: z.coerce.boolean().optional(),
});

const createProjectSchema = z.object({
  name: z.string(),
  note: z.string().optional(),
  customer_id: z.coerce.number().optional(),
  budget: z.coerce.number().optional(),
  budget_type: z.string().optional(),
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

const updateProjectSchema = z.object({
  id: z.coerce.number(),
  name: z.string().optional(),
  note: z.string().optional(),
  customer_id: z.coerce.number().optional(),
  budget: z.coerce.number().optional(),
  budget_type: z.string().optional(),
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
  update_hourly_rate_on_time_entries: z.coerce.boolean().optional(),
});

const getProjectSchema = z.object({
  id: z.coerce.number(),
});

const deleteProjectSchema = z.object({
  id: z.coerce.number(),
});

export function createProjectsTools(apiClient: MiteApiClient) {
  return {
    listProjects: {
      name: 'list_projects',
      description: 'List active or archived projects',
      inputSchema: listProjectsSchema,
      execute: async (input: z.infer<typeof listProjectsSchema>) => {
        const { archived, ...params } = input;
        const path = archived ? '/projects/archived.json' : '/projects.json';
        const projects = await apiClient.get<Project[]>(path, params);
        return { projects };
      },
    },

    getProject: {
      name: 'get_project',
      description: 'Get a specific project by ID',
      inputSchema: getProjectSchema,
      execute: async (input: z.infer<typeof getProjectSchema>) => {
        const response = await apiClient.get<{ project: Project }>(`/projects/${input.id}.json`);
        return response.project;
      },
    },

    createProject: {
      name: 'create_project',
      description: 'Create a new project (requires admin permissions)',
      inputSchema: createProjectSchema,
      execute: async (input: z.infer<typeof createProjectSchema>) => {
        const response = await apiClient.post<{ project: Project }>('/projects.json', {
          project: input,
        });
        return response.project;
      },
    },

    updateProject: {
      name: 'update_project',
      description: 'Update an existing project (requires admin permissions)',
      inputSchema: updateProjectSchema,
      execute: async (input: z.infer<typeof updateProjectSchema>) => {
        const { id, ...data } = input;
        const response = await apiClient.patch<{ project: Project }>(`/projects/${id}.json`, {
          project: data,
        });
        return response.project;
      },
    },

    deleteProject: {
      name: 'delete_project',
      description:
        'Delete a project (requires admin permissions, project must have no time entries)',
      inputSchema: deleteProjectSchema,
      execute: async (input: z.infer<typeof deleteProjectSchema>) => {
        await apiClient.delete(`/projects/${input.id}.json`);
        return { success: true, id: input.id };
      },
    },
  };
}
