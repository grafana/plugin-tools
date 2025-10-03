<script lang="ts">
  interface Props {
    executionLogs?: string[];
  }

  let { executionLogs = [] }: Props = $props();

  let isVisible = $derived(executionLogs.length > 0);
</script>

{#if isVisible}
  <div class="log-viewer">
    <div class="log-header">
      <h3>Execution Log</h3>
      <button class="clear-btn" onclick={() => executionLogs = []}>Clear</button>
    </div>
    <div class="log-content">
      {#each executionLogs as log (log)}
        <div class="log-entry">{log}</div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .log-viewer {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .log-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #2c3e50;
  }

  .clear-btn {
    background: #95a5a6;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s ease;
  }

  .clear-btn:hover {
    background: #7f8c8d;
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    background: #f8f9fa;
    border-radius: 4px;
    padding: 12px;
  }

  .log-entry {
    margin-bottom: 4px;
    color: #2c3e50;
  }

  .log-entry:last-child {
    margin-bottom: 0;
  }
</style>
