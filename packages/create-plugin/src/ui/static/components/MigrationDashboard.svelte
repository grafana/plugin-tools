<script lang="ts">
  import MigrationList from './MigrationList.svelte';
  import ProgressTracker from './ProgressTracker.svelte';
  import LogViewer from './LogViewer.svelte';
  import PreviewModal from './PreviewModal.svelte';
  import CompletionModal from './CompletionModal.svelte';

  interface MigrationInfo {
    id: string;
    name: string;
    version: string;
    description: string;
    dependencies: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }

  interface Props {
    migrations: MigrationInfo[];
    currentVersion: string;
    targetVersion: string;
    pluginId: string;
  }

  let { migrations, currentVersion, targetVersion, pluginId }: Props = $props();

  let selectedMigrations = $state<string[]>([]);
  let isExecuting = $state(false);
  let isPreviewModalOpen = $state(false);
  let previewData = $state<any>(null);
  let currentMigrationName = $state('');
  let currentMigrationDescription = $state('');
  // Migration execution tracking
  let executingMigrations = $state<string[]>([]);
  let completedMigrations = $state<string[]>([]);
  let failedMigrations = $state<string[]>([]);
  let executionLogs = $state<string[]>([]);

  // Completion modal state
  let isCompletionModalOpen = $state(false);

  async function startExecution() {
    if (selectedMigrations.length === 0) {
      alert('Please select at least one migration to execute.');
      return;
    }

    isExecuting = true;
    executingMigrations = [...selectedMigrations];
    completedMigrations = [];
    failedMigrations = [];
    executionLogs = [`Starting execution of ${selectedMigrations.length} migration(s)...`];

    try {
      const response = await fetch('/api/migrations/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          migrations: selectedMigrations
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Mark all as completed
        completedMigrations = [...executingMigrations];
        executingMigrations = [];
        executionLogs = [...executionLogs, 'All migrations completed successfully!'];

        // Show completion modal
        isCompletionModalOpen = true;
      } else {
        // Mark as failed
        failedMigrations = [...executingMigrations];
        executingMigrations = [];
        executionLogs = [...executionLogs, `Migration execution failed: ${result.error || 'Unknown error'}`];

        // Show completion modal even for failures
        isCompletionModalOpen = true;
      }
    } catch (error) {
      // Mark as failed
      failedMigrations = [...executingMigrations];
      executingMigrations = [];
      executionLogs = [...executionLogs, `Migration execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`];

      // Show completion modal for errors too
      isCompletionModalOpen = true;
    } finally {
      isExecuting = false;
    }
  }

  async function handlePreview(migrationId: string) {
    try {
      const response = await fetch(`/api/migrations/${migrationId}/preview`);
      const preview = await response.json();

      if (response.ok) {
        // Find the migration name for display
        const migration = migrations.find(m => m.id === migrationId);
        currentMigrationName = migration?.name || migrationId;
        currentMigrationDescription = migration?.description || '';
        previewData = preview;
        isPreviewModalOpen = true;
      } else {
        console.error('Failed to fetch preview:', preview);
        alert('Failed to load migration preview. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching migration preview:', error);
      alert('Error loading migration preview. Please try again.');
    }
  }

  function closePreviewModal() {
    isPreviewModalOpen = false;
    previewData = null;
    currentMigrationName = '';
  }

  function closeCompletionModal() {
    isCompletionModalOpen = false;
  }

  let totalMigrations = $derived(migrations.length);
  let selectedCount = $derived(selectedMigrations.length);
  let executingCount = $derived(executingMigrations.length);
  let completedCount = $derived(completedMigrations.length);
  let failedCount = $derived(failedMigrations.length);
</script>

<div class="dashboard">
  <div class="header">
    <div class="plugin-info">
      <h1>Plugin Update - {pluginId}</h1>
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
      <button class="btn btn-primary" disabled={selectedCount === 0 || isExecuting} onclick={startExecution}>
        {isExecuting ? 'Executing...' : 'Start Update'}
      </button>
    </div>
  </div>

  <div class="content">
    <div class="main-content">
      <MigrationList
        {migrations}
        bind:selectedMigrations
        onPreview={handlePreview}
        {executingMigrations}
        {completedMigrations}
        {failedMigrations}
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

      <ProgressTracker
        {totalMigrations}
        {executingCount}
        {completedCount}
        {failedCount}
      />
      <LogViewer {executionLogs} />
    </div>
  </div>

  <PreviewModal
    isOpen={isPreviewModalOpen}
    previewData={previewData}
    migrationName={currentMigrationName}
    migrationDescription={currentMigrationDescription}
    onClose={closePreviewModal}
  />

  <CompletionModal
    isOpen={isCompletionModalOpen}
    completedCount={completedCount}
    failedCount={failedCount}
    onClose={closeCompletionModal}
  />
</div>

<style>
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e1e5e9;
  }

  .plugin-info h1 {
    margin: 0;
    color: #2c3e50;
    font-size: 24px;
    font-weight: 600;
  }

  .version-info {
    color: #7f8c8d;
    font-size: 14px;
    margin-top: 4px;
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 13px;
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
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .content {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 16px;
  }

  .main-content {
    min-height: 300px;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .summary-card {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .summary-title {
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 8px;
  }

  .summary-stats {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px solid #f1f3f4;
  }

  .stat-item:last-child {
    border-bottom: none;
  }

  .stat-label {
    color: #5a6c7d;
    font-size: 13px;
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
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
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
      padding: 8px;
    }

    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
</style>
