<script lang="ts">
  import { onMount } from 'svelte';
  import MigrationDashboard from './components/MigrationDashboard.svelte';

  interface MigrationInfo {
    id: string;
    name: string;
    version: string;
    description: string;
    dependencies: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }

  let loading = $state(true);
  let migrations = $state<MigrationInfo[]>([]);
  let error = $state<string | null>(null);
  let currentVersion = $state<string>('');
  let targetVersion = $state<string>('');
  let pluginId = $state<string>('');
  onMount(async () => {
    try {
      const migrationsResponse = await fetch('/api/migrations');
      const migrationsJson = await migrationsResponse.json();
      migrations = migrationsJson.migrations || [];
      const pluginMetaResponse = await fetch('/api/pluginMeta');
      const pluginMetaJson = await pluginMetaResponse.json();
      currentVersion = pluginMetaJson.current_version;
      targetVersion = pluginMetaJson.target_version;
      pluginId = pluginMetaJson.pluginId;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load migration information';
    } finally {
      loading = false;
    }
  });
</script>

<div id="app">
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading migration information...</p>
    </div>
  {:else if error}
    <div class="error">
      <h2>Error</h2>
      <p>{error}</p>
    </div>
  {:else}
    <MigrationDashboard {migrations} {currentVersion} {targetVersion} {pluginId} />
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: #7f8c8d;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #ecf0f1;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: #e74c3c;
    text-align: center;
    padding: 20px;
  }

  .error h2 {
    margin: 0 0 16px 0;
  }
</style>
