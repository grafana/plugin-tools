import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import type { Props } from '@theme/DocItem/Content';
import { ViewAsMarkdown } from '@site/src/components/ViewAsMarkdown/ViewAsMarkdown';

// Ejected from @docusaurus/theme-classic to render ViewAsMarkdown under the front matter title.
// Docs with a markdown `# heading` get it from the h1 mapping in src/theme/MDXComponents.tsx instead.
function useSyntheticTitle(): string | null {
  const { metadata, frontMatter, contentTitle } = useDoc();
  const shouldRender = !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}

export default function DocItemContent({ children }: Props): ReactNode {
  const syntheticTitle = useSyntheticTitle();
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
          <ViewAsMarkdown />
        </header>
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
