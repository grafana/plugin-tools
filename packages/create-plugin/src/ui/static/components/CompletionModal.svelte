<script lang="ts">
  interface Props {
    isOpen: boolean;
    completedCount: number;
    failedCount: number;
    onClose: () => void;
  }

  let { isOpen, completedCount, failedCount, onClose }: Props = $props();

  async function handleClose() {
    try {
      // Call the shutdown endpoint
      await fetch('/api/shutdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      // Even if the shutdown fails, we still want to close the modal
      console.error('Failed to shutdown server:', error);
    }

    // Close the modal
    onClose();
  }

  let isSuccess = $derived(failedCount === 0);
  let title = $derived(isSuccess ? 'Migration Complete!' : 'Migration Finished');
  let message = $derived(
    isSuccess
      ? `All ${completedCount} migration(s) completed successfully!`
      : `${completedCount} migration(s) completed, ${failedCount} failed.`
  );
</script>

{#if isOpen}
  <div
    class="modal-backdrop"
    onclick={onClose}
    onkeydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <div
      class="modal-content"
      role="document"
    >
      <div class="modal-header">
        <h2 id="modal-title" class="modal-title">
          {#if isSuccess}
            <span class="success-icon">✅</span>
          {:else}
            <span class="warning-icon">⚠️</span>
          {/if}
          {title}
        </h2>
        <button class="close-btn" onclick={onClose} aria-label="Close modal">
          <span>×</span>
        </button>
      </div>

      <div class="modal-body">
        <p class="completion-message">{message}</p>

        <div class="instructions">
          <h3>Next Steps:</h3>
          <ol>
            <li>Close this browser tab</li>
            <li>Return to your terminal</li>
            <li>Your plugin has been updated successfully!</li>
          </ol>
        </div>

        {#if !isSuccess}
          <div class="warning-box">
            <p><strong>Note:</strong> Some migrations failed. Please check the logs above for details.</p>
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn btn-primary" onclick={handleClose}>
          Got it!
        </button>
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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 12px;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    max-width: 450px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 0 16px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 16px;
  }

  .modal-title {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .success-icon {
    font-size: 24px;
  }

  .warning-icon {
    font-size: 24px;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    color: #6b7280;
    cursor: pointer;
    padding: 3px;
    border-radius: 3px;
    transition: background-color 0.2s;
  }

  .close-btn:hover {
    background-color: #f3f4f6;
  }

  .modal-body {
    padding: 0 16px 16px 16px;
  }

  .completion-message {
    font-size: 14px;
    color: #374151;
    margin-bottom: 16px;
    line-height: 1.4;
  }

  .instructions {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .instructions h3 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  .instructions ol {
    margin: 0;
    padding-left: 16px;
    color: #374151;
  }

  .instructions li {
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .warning-box {
    background-color: #fef3cd;
    border: 1px solid #fbbf24;
    border-radius: 6px;
    padding: 12px;
    margin-top: 12px;
  }

  .warning-box p {
    margin: 0;
    color: #92400e;
    font-size: 13px;
  }

  .modal-footer {
    padding: 0 16px 16px 16px;
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-size: 13px;
  }

  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background-color: #2563eb;
  }

  .btn-primary:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
</style>
