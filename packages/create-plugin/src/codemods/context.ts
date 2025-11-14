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

export class Context {
  private files: ContextFile = {};
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
      this.files[path] = { content, changeType: 'update' };
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
