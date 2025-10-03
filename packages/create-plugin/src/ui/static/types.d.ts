// TypeScript declarations for browser environment
declare global {
  interface Window {
    location: Location;
  }

  interface Location {
    protocol: string;
    host: string;
  }

  interface Document {
    addEventListener(type: string, listener: (event: Event) => void): void;
    querySelector(selectors: string): Element | null;
    querySelectorAll(selectors: string): NodeListOf<Element>;
    createElement(tagName: string): HTMLElement;
    body: HTMLElement;
    dispatchEvent(event: Event): boolean;
  }

  interface HTMLElement {
    shadowRoot: ShadowRoot | null;
    attachShadow(options: { mode: 'open' | 'closed' }): ShadowRoot;
    setAttribute(name: string, value: string): void;
    getAttribute(name: string): string | null;
    classList: DOMTokenList;
    textContent: string | null;
    innerHTML: string;
    style: CSSStyleDeclaration;
    disabled: boolean;
    addEventListener(type: string, listener: (event: Event) => void): void;
    appendChild(child: Node): Node;
    removeChild(child: Node): Node;
    contains(child: Node): boolean;
    className: string;
  }

  interface ShadowRoot {
    innerHTML: string;
    querySelector(selectors: string): Element | null;
    querySelectorAll(selectors: string): NodeListOf<Element>;
  }

  interface HTMLButtonElement extends HTMLElement {
    disabled: boolean;
    textContent: string | null;
    addEventListener(type: string, listener: (event: Event) => void): void;
  }

  interface CustomEvent<T = unknown> extends Event {
    detail: T;
  }

  interface Event {
    detail?: unknown;
  }

  interface MessageEvent extends Event {
    data: string;
  }

  interface WebSocket {
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: ErrorEvent) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
    send(data: string): void;
    close(): void;
  }

  interface ErrorEvent extends Event {
    message: string;
    filename: string;
    lineno: number;
    colno: number;
    error: Error;
  }

  interface CloseEvent extends Event {
    code: number;
    reason: string;
    wasClean: boolean;
  }

  interface CSSStyleDeclaration {
    cssText: string;
  }

  interface DOMTokenList {
    toggle(token: string, force?: boolean): boolean;
    add(...tokens: string[]): void;
    remove(...tokens: string[]): void;
    contains(token: string): boolean;
  }

  interface NodeListOf<T extends Node> {
    length: number;
    item(index: number): T | null;
    [index: number]: T;
  }

  interface Element extends Node {
    setAttribute(name: string, value: string): void;
    getAttribute(name: string): string | null;
    classList: DOMTokenList;
    textContent: string | null;
  }

  interface Node {
    textContent: string | null;
  }

  interface CustomElementRegistry {
    define(name: string, constructor: CustomElementConstructor): void;
  }

  interface CustomElementConstructor {
    new (): HTMLElement;
  }

  // Web Components base class
  class HTMLElement {
    shadowRoot: ShadowRoot | null = null;
    attachShadow(options: { mode: 'open' | 'closed' }): ShadowRoot {
      return {} as ShadowRoot;
    }
    setAttribute(name: string, value: string): void {}
    getAttribute(name: string): string | null {
      return null;
    }
    classList: DOMTokenList = {} as DOMTokenList;
    textContent: string | null = null;
    innerHTML = '';
    style: CSSStyleDeclaration = {} as CSSStyleDeclaration;
    disabled = false;
    addEventListener(type: string, listener: (event: Event) => void): void {}
    appendChild(child: Node): Node {
      return child;
    }
    removeChild(child: Node): Node {
      return child;
    }
    contains(child: Node): boolean {
      return false;
    }
    className = '';
  }

  var document: Document;
  var window: Window;
  var customElements: CustomElementRegistry;
  var alert: (message: string) => void;
  var setTimeout: (handler: () => void, timeout: number) => number;
  var clearTimeout: (id: number) => void;
}

export {};
