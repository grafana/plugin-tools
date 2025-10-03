<script lang="ts">
  interface MigrationInfo {
    id: string;
    name: string;
    version: string;
    description: string;
    dependencies: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }

  interface Props {
    migration: MigrationInfo;
    selected?: boolean;
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    error?: string | null;
    onToggle?: (migrationId: string, selected: boolean) => void;
    onPreview?: (migrationId: string) => void;
  }

  let { migration, selected = false, status = 'pending', error = null, onToggle, onPreview }: Props = $props();

  function toggleSelection() {
    if (status === 'running' || status === 'completed') {
      return;
    }

    const newSelected = !selected;
    if (onToggle) {
      onToggle(migration.id, newSelected);
    }
  }

  function requestPreview() {
    if (onPreview) {
      onPreview(migration.id);
    }
  }

  function getStatusText(): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      skipped: 'Skipped',
    };
    return statusMap[status] || 'Unknown';
  }

  function getRiskColor(): string {
    const colorMap: Record<string, string> = {
      low: '#27ae60',
      medium: '#f39c12',
      high: '#e74c3c',
    };
    return colorMap[migration.riskLevel] || '#f39c12';
  }
</script>

<div class="card" class:selected class:status>
  <div class="card-header">
    <h3 class="migration-title">{migration.name}</h3>
    <div class="migration-version">v{migration.version}</div>
  </div>

  <p class="migration-description">{migration.description}</p>

  <div class="risk-indicator" style="color: {getRiskColor()}">
    <span>Risk: {migration.riskLevel.toUpperCase()}</span>
  </div>

  <div class="card-actions">
    <div class="action-left">
      <div
        class="toggle-switch"
        class:active={selected}
        class:disabled={status === 'running' || status === 'completed'}
        onclick={toggleSelection}
        onkeydown={(e) => e.key === 'Enter' && toggleSelection()}
        role="button"
        tabindex="0"
      ></div>
      <button
        class="preview-btn"
        onclick={requestPreview}
      >
        Preview Changes
      </button>
    </div>
    <span class="status-badge status-{status}">
      {getStatusText()}
    </span>
  </div>

  {#if status === 'running'}
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
  {/if}

  {#if error}
    <div class="error-message">{error}</div>
  {/if}
</div>

<style>
  .card {
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 20px;
    background: white;
    transition: all 0.2s ease;
    position: relative;
  }

  .card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .card.selected {
    border-color: #3498db;
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
  }

  .card.executing {
    border-color: #f39c12;
    background: #fef9e7;
  }

  .card.completed {
    border-color: #27ae60;
    background: #f0f9f0;
  }

  .card.failed {
    border-color: #e74c3c;
    background: #fdf2f2;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .migration-title {
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
    font-size: 16px;
  }

  .migration-version {
    background: #ecf0f1;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #7f8c8d;
    font-weight: 500;
  }

  .migration-description {
    color: #5a6c7d;
    margin-bottom: 16px;
    line-height: 1.5;
    font-size: 14px;
  }

  .card-actions {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .action-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .toggle-switch {
    position: relative;
    width: 50px;
    height: 24px;
    background-color: #bdc3c7;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .toggle-switch.active {
    background-color: #3498db;
  }

  .toggle-switch.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .toggle-switch.active::after {
    transform: translateX(26px);
  }

  .preview-btn {
    background: #95a5a6;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease;
  }

  .preview-btn:hover:not(:disabled) {
    background: #7f8c8d;
  }

  .preview-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-pending {
    background-color: #f39c12;
    color: white;
  }

  .status-running {
    background-color: #3498db;
    color: white;
  }

  .status-completed {
    background-color: #27ae60;
    color: white;
  }

  .status-failed {
    background-color: #e74c3c;
    color: white;
  }

  .status-skipped {
    background-color: #95a5a6;
    color: white;
  }

  .risk-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    margin-top: 8px;
  }

  .error-message {
    background: #fdf2f2;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 12px;
    border-radius: 4px;
    margin-top: 12px;
    font-size: 14px;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background-color: #ecf0f1;
    border-radius: 2px;
    overflow: hidden;
    margin-top: 8px;
  }

  .progress-fill {
    height: 100%;
    background-color: #3498db;
    transition: width 0.3s ease;
    border-radius: 2px;
    animation: progress 2s ease-in-out infinite;
  }

  @keyframes progress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }
</style>
