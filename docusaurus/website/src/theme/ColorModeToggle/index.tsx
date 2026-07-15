import React, { useRef, useEffect } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import ColorModeToggle from '@theme-original/ColorModeToggle';
import type { Props } from '@theme/ColorModeToggle';

function getTitle(colorMode: string): string {
  if (colorMode === 'dark') {
    return 'Let there be light (careful, bugs may become visible)';
  }
  return 'Return to the dark side';
}

export default function ColorModeToggleWrapper(props: Props): React.ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();
  const title = getTitle(colorMode);

  // Use a MutationObserver to strip the inner button's native title whenever
  // React re-applies it, so the browser falls through to our wrapper's title.
  useEffect(() => {
    const button = ref.current?.querySelector('button');
    if (!button) {
      return;
    }
    button.removeAttribute('title');

    const observer = new MutationObserver(() => {
      if (button.hasAttribute('title')) {
        button.removeAttribute('title');
      }
    });
    observer.observe(button, { attributes: true, attributeFilter: ['title'] });
    return () => observer.disconnect();
  }, [colorMode]);

  return (
    <div ref={ref} title={title}>
      <ColorModeToggle {...props} />
    </div>
  );
}
