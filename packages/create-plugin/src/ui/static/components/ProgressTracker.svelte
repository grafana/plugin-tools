<script lang="ts">
  interface Props {
    totalMigrations?: number;
    executingCount?: number;
    completedCount?: number;
    failedCount?: number;
  }

  let { 
    totalMigrations = 0, 
    executingCount = 0, 
    completedCount = 0, 
    failedCount = 0 
  }: Props = $props();

  let progress = $derived(totalMigrations > 0 ? ((completedCount + failedCount) / totalMigrations) * 100 : 0);
  let isVisible = $derived(executingCount > 0 || completedCount > 0 || failedCount > 0);
</script>

{#if isVisible}
  <div class="progress-tracker">
    <div class="progress-header">
      <h3>Progress</h3>
      <span class="progress-percentage">{Math.round(progress)}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progress}%"></div>
    </div>
  </div>
{/if}

<style>
  .progress-tracker {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .progress-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
  }

  .progress-percentage {
    font-size: 14px;
    font-weight: 600;
    color: #3498db;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background-color: #ecf0f1;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: #3498db;
    transition: width 0.3s ease;
    border-radius: 4px;
  }
</style>
