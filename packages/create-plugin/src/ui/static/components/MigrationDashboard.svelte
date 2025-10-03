<script lang="ts">
  import MigrationList from './MigrationList.svelte';
  import ProgressTracker from './ProgressTracker.svelte';
  import LogViewer from './LogViewer.svelte';

  interface MigrationInfo {
    id: string;
    name: string;
    version: string;
    description: string;
    dependencies: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }

  export let migrations: MigrationInfo[];

  let selectedMigrations = new Set<string>();
  let isExecuting = false;
  let currentVersion = '5.26.9';
  let targetVersion = '6.0.0';

  function handleMigrationSelection(event: CustomEvent<{ migrationId: string; selected: boolean }>) {
    const { migrationId, selected } = event.detail;
    if (selected) {
      selectedMigrations.add(migrationId);
    } else {
      selectedMigrations.delete(migrationId);
    }
  }

  function startExecution() {
    if (selectedMigrations.size === 0) {
      alert('Please select at least one migration to execute.');
      return;
    }

    isExecuting = true;
    // TODO: Implement execution logic
    console.log('Starting execution for migrations:', Array.from(selectedMigrations));
  }

  $: totalMigrations = migrations.length;
  $: selectedCount = selectedMigrations.size;
  $: executingCount = 0; // TODO: Track executing migrations
  $: completedCount = 0; // TODO: Track completed migrations
  $: failedCount = 0; // TODO: Track failed migrations
</script>

<div class="dashboard">
  <div class="header">
    <div class="plugin-info">
      <h1>Plugin Update</h1>
      <div class="version-info">
        <span>v{currentVersion}</span> →
        <span>v{targetVersion}</span>
      </div>
    </div>
    <div class="actions">
      <div class="status-indicator">
        <div class="status-dot" class:executing={isExecuting}></div>
        <span>{isExecuting ? 'Executing...' : 'Ready'}</span>
      </div>
      <button
        class="btn btn-primary"
        disabled={selectedCount === 0 || isExecuting}
        on:click={startExecution}
      >
        {isExecuting ? 'Executing...' : 'Start Update'}
      </button>
    </div>
  </div>

  <div class="content">
    <div class="main-content">
      <MigrationList
        {migrations}
        bind:selectedMigrations
        on:migration-selected={handleMigrationSelection}
        on:migration-deselected={handleMigrationSelection}
      />
    </div>

    <div class="sidebar">
      <div class="summary-card">
        <div class="summary-title">Update Summary</div>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Total Migrations</span>
            <span class="stat-value">{totalMigrations}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Selected</span>
            <span class="stat-value selected">{selectedCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Executing</span>
            <span class="stat-value executing">{executingCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Completed</span>
            <span class="stat-value completed">{completedCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Failed</span>
            <span class="stat-value failed">{failedCount}</span>
          </div>
        </div>
      </div>

      <ProgressTracker />
      <LogViewer />
    </div>
  </div>
</div>

<style>
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e1e5e9;
  }

  .plugin-info h1 {
    margin: 0;
    color: #2c3e50;
    font-size: 28px;
    font-weight: 600;
  }

  .version-info {
    color: #7f8c8d;
    font-size: 16px;
    margin-top: 8px;
  }

  .actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #f8f9fa;
    border-radius: 6px;
    font-size: 14px;
    color: #5a6c7d;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #27ae60;
  }

  .status-dot.executing {
    background: #3498db;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .content {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 30px;
  }

  .main-content {
    min-height: 400px;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .summary-card {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .summary-title {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 16px;
  }

  .summary-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f1f3f4;
  }

  .stat-item:last-child {
    border-bottom: none;
  }

  .stat-label {
    color: #5a6c7d;
    font-size: 14px;
  }

  .stat-value {
    font-weight: 600;
    color: #2c3e50;
  }

  .stat-value.selected {
    color: #3498db;
  }

  .stat-value.executing {
    color: #f39c12;
  }

  .stat-value.completed {
    color: #27ae60;
  }

  .stat-value.failed {
    color: #e74c3c;
  }

  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #3498db;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #2980b9;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .content {
      grid-template-columns: 1fr;
    }

    .dashboard {
      padding: 16px;
    }

    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
  }
</style>
