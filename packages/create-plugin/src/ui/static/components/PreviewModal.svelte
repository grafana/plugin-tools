<script lang="ts">
  import DiffViewer from './DiffViewer.svelte';

  interface PreviewData {
    files: Record<
      string,
      {
        content: string;
        changeType: 'create' | 'update' | 'delete';
      }
    >;
    originalFiles?: Record<string, string>;
    basePath: string;
  }

  interface Props {
    isOpen: boolean;
    previewData: PreviewData | null;
    migrationName: string;
    migrationDescription: string;
    onClose: () => void;
  }

  let { isOpen, previewData, migrationName, migrationDescription, onClose }: Props = $props();

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }

  function getChangeTypeColor(changeType: string): string {
    const colors = {
      create: '#27ae60',
      update: '#f39c12',
      delete: '#e74c3c',
    };
    return colors[changeType as keyof typeof colors] || '#95a5a6';
  }

  function getChangeTypeLabel(changeType: string): string {
    const labels = {
      create: 'New File',
      update: 'Modified',
      delete: 'Deleted',
    };
    return labels[changeType as keyof typeof labels] || changeType;
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="modal-backdrop"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div class="modal-container">
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">Preview: {migrationName}</h2>
        <button class="close-button" onclick={onClose} aria-label="Close preview">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <p class="migration-description">{migrationDescription}</p>
      <div class="modal-content">
        {#if previewData}
          <div class="preview-info">
            <div class="base-path">
              <strong>Base Path:</strong>
              {previewData.basePath}
            </div>
            <div class="file-count">
              <strong>{Object.keys(previewData.files).length}</strong> file(s) will be affected
            </div>
          </div>

          <div class="files-list">
            {#each Object.entries(previewData.files) as [filePath, fileData]}
              <div class="file-item">
                {#if fileData.changeType !== 'update'}
                  <div class="file-header">
                    <span class="file-path">{filePath}</span>
                    <span class="change-type" style="background-color: {getChangeTypeColor(fileData.changeType)}">
                      {getChangeTypeLabel(fileData.changeType)}
                    </span>
                  </div>
                  {#if fileData.changeType !== 'delete'}
                    <div class="file-content">
                      <pre><code>{fileData.content}</code></pre>
                    </div>
                  {/if}
                {/if}
                {#if fileData.changeType === 'update'}
                  <DiffViewer
                    fileDiff={{
                      fileName: filePath,
                      oldContent: previewData.originalFiles?.[filePath] || '', // Fallback to empty string if no original content
                      newContent: fileData.content,
                      changeType: fileData.changeType,
                    }}
                  />
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="no-preview">
            <p>No preview data available</p>
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={onClose}> Close </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e1e5e9;
  }

  .modal-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
  }

  .migration-description {
    margin: 0;
    font-size: 14px;
    padding: 20px 24px 0 24px;
    color: #5a6c7d;
    line-height: 1.5;
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    color: #7f8c8d;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: #f8f9fa;
    color: #2c3e50;
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .preview-info {
    background: #f8f9fa;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .base-path {
    margin-bottom: 4px;
    font-size: 13px;
    color: #5a6c7d;
  }

  .file-count {
    font-size: 13px;
    color: #5a6c7d;
  }

  .files-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .file-item {
    margin-bottom: 8px;
  }

  .file-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f8f9fa;
    border-bottom: 1px solid #e1e5e9;
    border: 1px solid #e1e5e9;
    border-radius: 4px 4px 0 0;
  }

  .file-path {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    color: #2c3e50;
    font-weight: 500;
  }

  .change-type {
    padding: 3px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .file-content {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e1e5e9;
    border-top: none;
    border-radius: 0 0 4px 4px;
  }

  .file-content pre {
    margin: 0;
    padding: 12px;
    background: #f8f9fa;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #2c3e50;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .no-preview {
    text-align: center;
    padding: 40px 20px;
    color: #7f8c8d;
  }

  .modal-footer {
    padding: 20px 24px;
    border-top: 1px solid #e1e5e9;
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary {
    background: #95a5a6;
    color: white;
  }

  .btn-secondary:hover {
    background: #7f8c8d;
  }

  @media (max-width: 768px) {
    .modal-container {
      margin: 10px;
      max-height: 95vh;
    }

    .modal-header {
      padding: 16px 20px;
    }

    .modal-content {
      padding: 20px;
    }

    .file-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
</style>
