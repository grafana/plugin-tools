/**
 * Returns a selector engine that resolves selectors by data-testid or aria-label
 */
export const grafanaE2ESelectorEngine = () => ({
  // Returns the first element matching given selector in the root's subtree.
  query(root: Element, selector: string) {
    if (selector.startsWith('data-testid')) {
      return root.querySelector(`[data-testid="${selector}"]`);
    }

    return root.querySelector(`[aria-label="${selector}"]`);
  },

  // Returns all elements matching given selector in the root's subtree.
  queryAll(root: Element, selector: string) {
    if (selector.startsWith('data-testid')) {
      return root.querySelectorAll(`[data-testid="${selector}"]`);
    }

    return root.querySelectorAll(`[aria-label="${selector}"]`);
  },
});
