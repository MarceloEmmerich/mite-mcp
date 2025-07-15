import { z } from 'zod';
import type { Project } from '../types/index.js';
import type { MiteApiClient } from '../utils/api-client.js';
import { optionalBoolean, optionalNumber, requiredNumber } from '../utils/validation.js';

const listProjectsSchema = z.object({
  name: z.string().optional(),
  customer_id: optionalNumber,
  limit: optionalNumber,
  page: optionalNumber,
  archived: optionalBoolean,
});

const createProjectSchema = z.object({
  name: z.string(),
  note: z.string().optional(),
  customer_id: optionalNumber,
  budget: optionalNumber,
  budget_type: z.string().optional(),
  archived: optionalBoolean,
  hourly_rate: optionalNumber,
  hourly_rates_per_service: z
    .array(
      z.object({
        service_id: requiredNumber,
        hourly_rate: requiredNumber,
      })
    )
    .optional(),
});

const updateProjectSchema = z.object({
  id: requiredNumber,
  name: z.string().optional(),
  note: z.string().optional(),
  customer_id: optionalNumber,
  budget: optionalNumber,
  budget_type: z.string().optional(),
  archived: optionalBoolean,
  hourly_rate: optionalNumber,
  hourly_rates_per_service: z
    .array(
      z.object({
        service_id: requiredNumber,
        hourly_rate: requiredNumber,
      })
    )
    .optional(),
  update_hourly_rate_on_time_entries: optionalBoolean,
});

const getProjectSchema = z.object({
  id: requiredNumber,
});

const deleteProjectSchema = z.object({
  id: requiredNumber,
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
