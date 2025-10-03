<script lang="ts">
  import MigrationCard from './MigrationCard.svelte';

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
    selectedMigrations?: string[];
    onPreview?: (migrationId: string) => void;
  }

  let { migrations, selectedMigrations = $bindable([]), onPreview }: Props = $props();

  // Update all selected state when migrations change
  let allSelected = $state(false);

  // Derived value to check if all are selected
  let allSelectedComputed = $derived(migrations.length > 0 && selectedMigrations.length === migrations.length);

  function toggleAllMigrations() {
    console.log('toggleAllMigrations called, current allSelected:', allSelected);
    allSelected = !allSelected;
    console.log('new allSelected:', allSelected);

    if (allSelected) {
      console.log('Selecting all migrations');
      selectAllMigrations();
    } else {
      console.log('Deselecting all migrations');
      deselectAllMigrations();
    }
  }

  function selectAllMigrations() {
    migrations.forEach((migration) => {
      if (!selectedMigrations.includes(migration.id)) {
        selectedMigrations = [...selectedMigrations, migration.id];
      }
    });
  }

  function deselectAllMigrations() {
    migrations.forEach((migration) => {
      selectedMigrations = selectedMigrations.filter((id) => id !== migration.id);
    });
  }

  function handleMigrationToggle(migrationId: string, selected: boolean) {
    if (selected) {
      if (!selectedMigrations.includes(migrationId)) {
        selectedMigrations = [...selectedMigrations, migrationId];
      }
    } else {
      selectedMigrations = selectedMigrations.filter(id => id !== migrationId);
    }
  }
</script>

<div class="migration-list">
  <div class="list-header">
    <h2 class="list-title">Available Migrations</h2>
    <div class="list-actions">
      <div class="toggle-container">
        <span class="toggle-label">Select All</span>
        <div
          class="toggle-switch"
          class:active={allSelectedComputed}
          onclick={toggleAllMigrations}
          onkeydown={(e) => e.key === 'Enter' && toggleAllMigrations()}
          role="button"
          tabindex="0"
        ></div>
      </div>
    </div>
  </div>

  <div class="migrations-container">
    {#if migrations.length === 0}
      <div class="empty-state">
        <h3>No migrations available</h3>
        <p>Your plugin is already up to date.</p>
      </div>
    {:else}
      {#each migrations as migration (migration.id)}
        <MigrationCard
          {migration}
          selected={selectedMigrations.includes(migration.id)}
          onToggle={handleMigrationToggle}
          {onPreview}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  .migration-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .list-title {
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }

  .list-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toggle-label {
    font-size: 14px;
    color: #5a6c7d;
    font-weight: 500;
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

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #7f8c8d;
  }

  .empty-state h3 {
    margin: 0 0 8px 0;
    color: #5a6c7d;
  }

  .empty-state p {
    margin: 0;
    font-size: 14px;
  }

  .migrations-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
