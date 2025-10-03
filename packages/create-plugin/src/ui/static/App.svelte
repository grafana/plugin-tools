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

  let loading = true;
  let migrations: MigrationInfo[] = [];
  let error: string | null = null;

  onMount(async () => {
    try {
      console.log('Loading migrations...');
      const response = await fetch('/api/migrations');
      const data = await response.json();
      console.log('Migration data received:', data);
      migrations = data.migrations || [];
      console.log('Migrations array:', migrations);
    } catch (err) {
      console.error('Failed to load migrations:', err);
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
    <MigrationDashboard {migrations} />
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
