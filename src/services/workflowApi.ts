/**
 * Workflow API Client Service
 * Phase 7: API Integration Layer
 *
 * Centralized API client for all workflow-related features:
 * - Config Templates (Phase 4 & 5)
 * - Visual Builder (Phase 6)
 * - Workflow Execution
 */

import type {
  TemplateSuggestionsResponse,
  ConfigTemplate,
  SearchTemplatesResponse,
  ListTemplatesResponse,
  NodeTypeMetadata,
  AvailableVariablesResponse,
  ValidationResult,
  TableSchema,
  ListTablesResponse,
  BuildQueryResponse,
  BuildExpressionResponse,
  TestConfigResponse,
  OperatorsResponse,
  FunctionsResponse,
  TriggerWorkflowRequest,
  CompleteTaskRequest,
  ValidateExpressionRequest,
  BuildQueryRequest,
  BuildExpressionRequest,
  TestConfigRequest,
} from '@/types/workflow'

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Fetch wrapper with error handling
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }))
      throw new Error(error.error || error.message || 'API request failed')
    }

    return response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

/**
 * Workflow API Service
 */
export class WorkflowAPI {
  // ========================================================================
  // Template APIs (Phase 5: Smart Defaults)
  // ========================================================================

  /**
   * Get suggested templates for a node type
   * Used when user adds a node to show relevant templates
   */
  static async getTemplateSuggestions(
    nodeTypeId: string,
    workflowId?: string,
    limit: number = 10
  ): Promise<TemplateSuggestionsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(workflowId && { workflow_id: workflowId }),
    })

    return apiFetch(`/api/templates/suggestions/${nodeTypeId}?${params}`)
  }

  /**
   * Get full template configuration by ID
   */
  static async getTemplate(templateId: string): Promise<ConfigTemplate> {
    return apiFetch(`/api/templates/${templateId}`)
  }

  /**
   * Search templates by name, description, or tags
   */
  static async searchTemplates(
    query: string,
    limit: number = 20
  ): Promise<SearchTemplatesResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    })

    return apiFetch(`/api/templates/search?${params}`)
  }

  /**
   * List all templates with optional filters
   */
  static async listTemplates(filters?: {
    primitive?: string
    category?: string
    institution_id?: string
  }): Promise<ListTemplatesResponse> {
    const params = new URLSearchParams()

    if (filters?.primitive) params.set('primitive', filters.primitive)
    if (filters?.category) params.set('category', filters.category)
    if (filters?.institution_id) params.set('institution_id', filters.institution_id)

    return apiFetch(`/api/templates?${params}`)
  }

  /**
   * Get node type metadata (context hints, output schema, etc.)
   */
  static async getNodeTypeMetadata(nodeTypeId: string): Promise<NodeTypeMetadata> {
    return apiFetch(`/api/templates/node-types/${nodeTypeId}/metadata`)
  }

  /**
   * Get all template categories
   */
  static async getCategories(): Promise<{ categories: string[]; count: number }> {
    return apiFetch('/api/templates/categories')
  }

  // ========================================================================
  // Visual Builder APIs (Phase 6)
  // ========================================================================

  /**
   * Get all available variables in workflow context for autocomplete
   */
  static async getAvailableVariables(
    workflowId: string,
    currentNodeKey?: string
  ): Promise<AvailableVariablesResponse> {
    const params = currentNodeKey
      ? new URLSearchParams({ current_node_key: currentNodeKey })
      : ''

    return apiFetch(`/api/visual-builder/workflows/${workflowId}/variables?${params}`)
  }

  /**
   * Validate a template expression without executing it
   */
  static async validateExpression(
    request: ValidateExpressionRequest
  ): Promise<ValidationResult> {
    return apiFetch('/api/visual-builder/validate-expression', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * List all database tables
   */
  static async listTables(schema: string = 'public'): Promise<ListTablesResponse> {
    const params = new URLSearchParams({ schema })
    return apiFetch(`/api/visual-builder/tables?${params}`)
  }

  /**
   * Get schema for a specific table
   */
  static async getTableSchema(tableName: string): Promise<TableSchema> {
    return apiFetch(`/api/visual-builder/tables/${tableName}/schema`)
  }

  /**
   * Build DB_EXEC config from visual query builder inputs
   */
  static async buildQuery(request: BuildQueryRequest): Promise<BuildQueryResponse> {
    return apiFetch('/api/visual-builder/build-query', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Build expression from visual builder parts (left operator right)
   */
  static async buildExpression(
    request: BuildExpressionRequest
  ): Promise<BuildExpressionResponse> {
    return apiFetch('/api/visual-builder/build-expression', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Test config with sample data (dry run)
   */
  static async testConfig(request: TestConfigRequest): Promise<TestConfigResponse> {
    return apiFetch('/api/visual-builder/test-config', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Get all available operators for expression builder
   */
  static async getOperators(): Promise<OperatorsResponse> {
    return apiFetch('/api/visual-builder/operators')
  }

  /**
   * Get all available template functions
   */
  static async getFunctions(): Promise<FunctionsResponse> {
    return apiFetch('/api/visual-builder/functions')
  }

  // ========================================================================
  // Workflow Execution APIs
  // ========================================================================

  /**
   * Trigger a workflow
   */
  static async triggerWorkflow(request: TriggerWorkflowRequest): Promise<{ run_id: string }> {
    return apiFetch('/api/workflows/trigger', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Complete a workflow task (form submission or approval)
   */
  static async completeTask(
    taskId: string,
    submission: CompleteTaskRequest
  ): Promise<{ success: boolean; run_id: string }> {
    return apiFetch(`/api/workflows/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify(submission),
    })
  }

  /**
   * Execute current step of workflow run
   */
  static async executeWorkflowStep(runId: string): Promise<{ status: string }> {
    return apiFetch(`/api/workflows/runs/${runId}/execute`, {
      method: 'POST',
    })
  }

  /**
   * Get workflow run status
   */
  static async getWorkflowRun(runId: string): Promise<any> {
    return apiFetch(`/api/workflows/runs/${runId}`)
  }

  // ========================================================================
  // Workflow Management APIs
  // ========================================================================

  /**
   * Get workflow by ID
   */
  static async getWorkflow(workflowId: string): Promise<any> {
    return apiFetch(`/api/workflows/${workflowId}`)
  }

  /**
   * Update workflow node configuration
   */
  static async updateNodeConfig(
    nodeId: string,
    config: {
      config?: Record<string, any>
      config_template_id?: string
      config_overrides?: Record<string, any>
    }
  ): Promise<any> {
    return apiFetch(`/api/workflows/nodes/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    })
  }

  /**
   * Create workflow node
   */
  static async createNode(workflowId: string, nodeData: any): Promise<any> {
    return apiFetch(`/api/workflows/${workflowId}/nodes`, {
      method: 'POST',
      body: JSON.stringify(nodeData),
    })
  }

  /**
   * Delete workflow node
   */
  static async deleteNode(nodeId: string): Promise<void> {
    return apiFetch(`/api/workflows/nodes/${nodeId}`, {
      method: 'DELETE',
    })
  }
}

/**
 * Export singleton instance
 */
export default WorkflowAPI
