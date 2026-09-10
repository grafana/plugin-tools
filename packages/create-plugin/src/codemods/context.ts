import { constants, accessSync, readFileSync, readdirSync } from 'node:fs';
import { relative, normalize, join, dirname } from 'node:path';
import { debug } from '../utils/utils.cli.js';

const codemodsDebug = debug.extend('codemods');

export type ContextFile = Record<
  string,
  {
    content?: string;
    changeType: 'add' | 'delete' | 'update';
  }
>;

/** Why a codemod declined to run, and what the author can do about it. */
export type SkipNotice = {
  reason: string;
  hints: string[];
};

export class Context {
  private files: ContextFile = {};
  private nextSteps: string[] = [];
  private skipNotice: SkipNotice | undefined;
  basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || process.cwd();
  }

  addFile(filePath: string, content: string) {
    const path = this.normalisePath(filePath);
    if (!this.doesFileExist(path)) {
      this.files[path] = { content, changeType: 'add' };
    } else {
      throw new Error(`File ${path} already exists`);
    }
  }

  deleteFile(filePath: string) {
    const path = this.normalisePath(filePath);

    // Delete a file that was added to the current context
    if (this.files[path] && this.files[path].changeType === 'add') {
      delete this.files[path];
      return;
    }
    // Delete a file from the disk
    else if (this.doesFileExistOnDisk(path)) {
      this.files[path] = { ...this.files[path], changeType: 'delete' };
    }
    // Delete a file that was updated in the current context
    else if (this.files[path] && this.files[path].changeType === 'update') {
      throw new Error(`File ${path} was marked as updated already`);
    } else {
      throw new Error(`File ${path} does not exist`);
    }
  }

  updateFile(filePath: string, content: string) {
    const path = this.normalisePath(filePath);
    const originalContent = this.getFile(path);

    if (originalContent === undefined) {
      throw new Error(`File ${path} does not exist`);
    }

    if (originalContent !== content) {
      // Preserve 'add' so a file added earlier in this same context (its directory may not exist on
      // disk yet) doesn't get downgraded to 'update' and fail to write.
      const changeType = this.files[path]?.changeType === 'add' ? 'add' : 'update';
      this.files[path] = { content, changeType };
    } else {
      codemodsDebug(`Context.updateFile() - no updates for ${filePath}`);
    }
  }

  doesFileExist(filePath: string) {
    const path = this.normalisePath(filePath);

    // Added / updated in this context
    if (this.files[path] && this.files[path].changeType !== 'delete') {
      return true;
    }

    return this.doesFileExistOnDisk(path);
  }

  doesFileExistOnDisk(filePath: string) {
    const path = join(this.basePath, this.normalisePath(filePath));

    try {
      accessSync(path, constants.R_OK | constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  getFile(filePath: string) {
    const path = this.normalisePath(filePath);

    // Deleted in this context
    if (this.files[path] && this.files[path].changeType === 'delete') {
      return undefined;
    }

    // Added / updated in this context
    if (this.files[path]) {
      return this.files[path].content;
    }

    if (this.doesFileExistOnDisk(path)) {
      return readFileSync(join(this.basePath, path), 'utf-8');
    }

    return undefined;
  }

  listChanges() {
    return this.files;
  }

  hasChanges() {
    return Object.keys(this.files).length > 0;
  }

  /**
   * Record something the author should do once the codemod has finished.
   *
   * Codemods never print. The command renders these after the change list and the install, so they
   * are the last thing on screen rather than the first - which is where a codemod printing for
   * itself would put them. Wrap a command in backticks and the renderer styles it as code.
   */
  addNextStep(step: string) {
    this.nextSteps.push(step);
  }

  listNextSteps(): string[] {
    return [...this.nextSteps];
  }

  /**
   * Decline to run, with the reason and anything the author can do about it.
   *
   * Use this for "this codemod does not apply here" - the wrong plugin type, a conflicting setting,
   * a precondition the author can fix. The command reports it as a warning and the process still
   * exits 0. Keep `throw` for genuine faults, such as a missing template, which mean the package
   * itself is broken.
   *
   * The reason completes the sentence "Skipped <codemod name>: ", so start it lowercase and leave
   * the codemod's own name out of it.
   *
   * Skipping means nothing happened, so call it before staging any changes. The runner rejects a
   * context that is both skipped and changed rather than silently discarding the edits. Calling
   * this twice keeps the last reason, so guard clauses should return straight after skipping.
   */
  skip(reason: string, hints: string[] = []) {
    codemodsDebug(`Context.skip() - ${reason}`);
    this.skipNotice = { reason, hints };
  }

  getSkip(): SkipNotice | undefined {
    return this.skipNotice;
  }

  renameFile(from: string, to: string) {
    const normalisedTo = this.normalisePath(to);
    const contents = this.getFile(from);

    if (contents === undefined) {
      throw new Error(`File ${from} does not exist`);
    }
    // File was already touched in this context
    else if (this.files[normalisedTo]) {
      throw new Error(`File ${to} already exists`);
    } else {
      this.deleteFile(from);
      this.addFile(to, contents);
    }
  }

  readDir(folderPath: string): string[] {
    const path = this.normalisePath(folderPath);
    const childrenOnDisk = this.readDirFromDisk(folderPath)
      .map((child) => join(path, child))
      .filter((child) => !this.files[child] || this.files[child].changeType !== 'delete');
    const childrenAddedInContext = Object.keys(this.files).filter(
      (p) => dirname(p) === path && this.files[p].changeType === 'add'
    );
    return [...childrenOnDisk, ...childrenAddedInContext];
  }

  readDirFromDisk(folderPath: string): string[] {
    const path = this.normalisePath(folderPath);

    try {
      return readdirSync(join(this.basePath, path));
    } catch (error) {
      return [];
    }
  }

  normalisePath(filePath: string) {
    return normalize(relative(this.basePath, join(this.basePath, filePath)));
  }
}
