export interface UIServerConfig {
  port?: number;
  host?: string;
}

export interface MigrationInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MigrationPreview {
  migrationId: string;
  changes: FileChange[];
  summary: {
    added: number;
    modified: number;
    deleted: number;
  };
}

export interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  diff?: string;
}

export interface MigrationExecution {
  migrationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}
