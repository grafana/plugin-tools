export interface RudderStack {
  track(event: string, properties: Record<string, any>): void;
  page(properties?: Record<string, any>): void;
  getAnonymousId(): Promise<string>;
  load(writeKey: string, url: string, options: { configUrl: string }): void;
}
