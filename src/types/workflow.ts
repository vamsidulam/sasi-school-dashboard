/**
 * Type definitions for Workflow Builder and Config Templates
 * Phase 7: API Integration Layer
 */

// ============================================================================
// Config Templates
// ============================================================================

export interface ConfigTemplate {
  id: string
  name: string
  description: string
  primitive: 'DB_EXEC' | 'CONDITION' | 'AI_EVAL' | 'EMAIL' | 'TRANSFORM'
  category: string
  tags: string[]
  template_config: Record<string, any>
  institution_id?: string
  is_active: boolean
}

export interface TemplateSuggestion {
  template_id: string
  name: string
  description: string
  category: string
  tags: string[]
  relevance_score: number
}

export interface TemplateSuggestionsResponse {
  node_type_id: string
  suggestions: TemplateSuggestion[]
  count: number
}

export interface SearchTemplatesResponse {
  query: string
  templates: ConfigTemplate[]
  count: number
}

export interface ListTemplatesResponse {
  templates: ConfigTemplate[]
  count: number
  filters: {
    primitive?: string
    category?: string
    institution_id?: string
  }
}

// ============================================================================
// Node Types
// ============================================================================

export interface NodeTypeMetadata {
  id: string
  primitive: string
  usage_category: string
  context_hints: {
    required: string[]
    optional: string[]
    common_patterns: string[]
  }
  output_schema: Record<string, any>
  default_presets: string[]
  suggested_for: string[]
}

// ============================================================================
// Visual Builder
// ============================================================================

export interface ContextVariable {
  name: string
  type: string
  description: string
  example: string
}

export interface NodeOutput {
  node_key: string
  label: string
  primitive: string
  output_schema: Record<string, any>
}

export interface TemplateFunction {
  name: string
  signature: string
  returns: string
  description: string
  example: string
  category: string
}

export interface AvailableVariablesResponse {
  root_variables: ContextVariable[]
  form_data: {
    name: string
    type: string
    description: string
    example: string
    note: string
  }
  node_outputs: NodeOutput[]
  functions: TemplateFunction[]
}

export interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
  result?: any
  result_type?: string
}

export interface TableSchema {
  table: string
  columns: {
    name: string
    type: string
    nullable: boolean
  }[]
  count: number
}

export interface ListTablesResponse {
  tables: string[]
  count: number
  schema: string
}

export interface BuildQueryResponse {
  config: Record<string, any>
  primitive: 'DB_EXEC'
  ready: boolean
}

export interface BuildExpressionResponse {
  expression: string
  ready: boolean
}

export interface TestConfigResponse {
  success: boolean
  resolved_config?: Record<string, any>
  error?: string
  primitive: string
  note?: string
}

export interface Operator {
  symbol: string
  label: string
  example: string
}

export interface OperatorsResponse {
  comparison: Operator[]
  arithmetic: Operator[]
  logical: Operator[]
}

export interface FunctionsResponse {
  functions: TemplateFunction[]
}

// ============================================================================
// Node Configuration
// ============================================================================

export interface WorkflowNode {
  id: string
  workflow_id: string
  node_type_id: string
  node_key: string
  label: string
  config: Record<string, any>
  config_template_id?: string
  config_overrides?: Record<string, any>
  position_x: number
  position_y: number
}

export interface NodeConfig {
  template_id?: string
  overrides?: Record<string, any>
  direct_config?: Record<string, any>
}

// ============================================================================
// Workflow Execution
// ============================================================================

export interface WorkflowRun {
  id: string
  workflow_id: string
  institution_id: string
  status: 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED'
  context: Record<string, any>
  current_node_id?: string
  target_user_id?: string
  started_at: string
  completed_at?: string
}

export interface WorkflowTask {
  id: string
  run_id: string
  node_id: string
  institution_id: string
  task_type: 'form' | 'approval' | 'review'
  title: string
  config: Record<string, any>
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  submission?: Record<string, any>
  created_at: string
  completed_at?: string
}

// ============================================================================
// API Request Types
// ============================================================================

export interface TriggerWorkflowRequest {
  workflow_id: string
  target_user_id: string
  target_email: string
  target_name: string
  institution_id: string
  [key: string]: any // Additional context
}

export interface CompleteTaskRequest {
  [key: string]: any // Form submission data
}

export interface ValidateExpressionRequest {
  expression: string
  sample_context?: Record<string, any>
}

export interface BuildQueryRequest {
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  filters?: Record<string, any>
  data?: Record<string, any>
  returning?: string[]
}

export interface BuildExpressionRequest {
  left: string
  operator: string
  right: string
}

export interface TestConfigRequest {
  primitive: string
  config: Record<string, any>
  sample_context: Record<string, any>
}
