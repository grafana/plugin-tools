<script lang="ts">
  import { diffLines as diffLinesLib, type Change } from 'diff';

  interface DiffLine {
    type: 'added' | 'removed' | 'unchanged' | 'context';
    content: string;
    lineNumber?: number;
  }

  interface FileDiff {
    oldContent: string;
    newContent: string;
    fileName: string;
    changeType: 'create' | 'update' | 'delete';
  }

  interface Props {
    fileDiff: FileDiff;
  }

  let { fileDiff }: Props = $props();

  // Use the diff library for better change detection
  function generateDiff(oldContent: string, newContent: string): DiffLine[] {
    const changes = diffLinesLib(oldContent, newContent);
    const diff: DiffLine[] = [];
    let lineNumber = 1;

    changes.forEach((change: Change) => {
      const lines = change.value.split('\n');
      // Remove the last empty line if it exists
      if (lines[lines.length - 1] === '') {
        lines.pop();
      }

      lines.forEach((line: string) => {
        if (change.added) {
          diff.push({
            type: 'added',
            content: line,
            lineNumber: lineNumber
          });
        } else if (change.removed) {
          diff.push({
            type: 'removed',
            content: line,
            lineNumber: lineNumber
          });
        } else {
          diff.push({
            type: 'unchanged',
            content: line,
            lineNumber: lineNumber
          });
        }
        lineNumber++;
      });
    });

    return diff;
  }

  // Generate diff lines using a regular function
  function getDiffLines() {
    let result;

    if (fileDiff.changeType === 'create') {
      result = fileDiff.newContent.split('\n').map((line, lineIndex) => ({
        type: 'added' as const,
        content: line,
        lineNumber: lineIndex + 1,
      }));
    } else if (fileDiff.changeType === 'delete') {
      result = fileDiff.oldContent.split('\n').map((line, lineIndex) => ({
        type: 'removed' as const,
        content: line,
        lineNumber: lineIndex + 1,
      }));
    } else {
      // For updates, generate a proper diff between old and new content
      result = generateDiff(fileDiff.oldContent, fileDiff.newContent);
    }

    return result;
  }

  let diffLines = getDiffLines();

  function getLineClass(type: string): string {
    const classes = {
      added: 'diff-line-added',
      removed: 'diff-line-removed',
      unchanged: 'diff-line-unchanged',
      context: 'diff-line-context',
    };
    return classes[type as keyof typeof classes] || '';
  }

  function getLineIcon(type: string): string {
    const icons = {
      added: '+',
      removed: '-',
      unchanged: ' ',
      context: ' ',
    };
    return icons[type as keyof typeof icons] || ' ';
  }
</script>

<div class="diff-viewer">
  <div class="diff-header">
    <div class="file-info">
      <span class="file-name">{fileDiff.fileName}</span>
      <span class="change-type change-{fileDiff.changeType}">
        {fileDiff.changeType === 'create' ? 'New File' : fileDiff.changeType === 'update' ? 'Modified' : 'Deleted'}
      </span>
    </div>
  </div>

  <div class="diff-content">
    <div class="diff-lines">
      {#each diffLines as line}
        <div class="diff-line {getLineClass(line.type)}">
          <div class="line-number">
            {line.lineNumber}
          </div>
          <div class="line-icon">
            {getLineIcon(line.type)}
          </div>
          <div class="line-content">
            <code>{line.content}</code>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .diff-viewer {
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    overflow: hidden;
    background: white;
  }

  .diff-header {
    background: #f8f9fa;
    border-bottom: 1px solid #e1e5e9;
    padding: 12px 16px;
  }

  .file-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .file-name {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    font-weight: 500;
    color: #2c3e50;
  }

  .change-type {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .change-create {
    background-color: #27ae60;
  }

  .change-update {
    background-color: #f39c12;
  }

  .change-delete {
    background-color: #e74c3c;
  }

  .diff-content {
    max-height: 400px;
    overflow-y: auto;
  }

  .diff-lines {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
  }

  .diff-line {
    display: flex;
    min-height: 20px;
    border-bottom: 1px solid #f1f3f4;
  }

  .diff-line:last-child {
    border-bottom: none;
  }

  .line-number {
    width: 50px;
    padding: 2px 8px;
    background: #f8f9fa;
    color: #7f8c8d;
    text-align: right;
    font-size: 11px;
    border-right: 1px solid #e1e5e9;
    flex-shrink: 0;
  }

  .line-icon {
    width: 20px;
    padding: 2px 4px;
    text-align: center;
    font-weight: bold;
    flex-shrink: 0;
  }

  .line-content {
    flex: 1;
    padding: 2px 8px;
    overflow-x: auto;
  }

  .line-content code {
    background: none;
    padding: 0;
    font-size: inherit;
    color: inherit;
  }

  .diff-line-added {
    background-color: #d4edda;
  }

  .diff-line-added .line-icon {
    color: #27ae60;
  }

  .diff-line-removed {
    background-color: #f8d7da;
  }

  .diff-line-removed .line-icon {
    color: #e74c3c;
  }

  .diff-line-unchanged {
    background-color: white;
  }

  .diff-line-context {
    background-color: #f8f9fa;
  }

  /* Scrollbar styling */
  .diff-content::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .diff-content::-webkit-scrollbar-track {
    background: #f1f3f4;
  }

  .diff-content::-webkit-scrollbar-thumb {
    background: #bdc3c7;
    border-radius: 4px;
  }

  .diff-content::-webkit-scrollbar-thumb:hover {
    background: #95a5a6;
  }

  @media (max-width: 768px) {
    .file-info {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .line-number {
      width: 40px;
      font-size: 10px;
    }

    .line-icon {
      width: 16px;
    }
  }
</style>
