import { MetaBase } from './base';

export class MetaRegistry {
  private meta: MetaBase[] = [];

  register(meta: MetaBase): void {
    this.meta.push(meta);
  }

  toJSON(): string {
    return JSON.stringify(this.meta);
  }

  toArray(): MetaBase[] {
    return Array.from(this.meta);
  }
}
