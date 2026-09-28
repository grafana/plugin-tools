import React, { type ComponentProps } from 'react';
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
import MDXHeading from '@theme/MDXComponents/Heading';
import CodeSnippets from '@site/src/components/CodeSnippets/CodeSnippets';
import SyncCommand from '@site/src/components/SyncCommand/SyncCommand';
import DocLinkList from '@site/src/components/DocLinkList/DocLinkList';
import YouTubeEmbed from '@site/src/components/YouTubeEmbed/YouTubeEmbed';
import { ViewAsMarkdown } from '@site/src/components/ViewAsMarkdown/ViewAsMarkdown';

export default {
  // Re-use the default mapping
  ...MDXComponents,
  // Docs with a markdown `# heading` render their title here, see src/theme/DocItem/Content
  h1: (props: ComponentProps<'h1'>) => (
    <>
      <MDXHeading as="h1" {...props} />
      <ViewAsMarkdown />
    </>
  ),
  // Map the "<CodeSnippets>" tag to our CodeSnippets component
  // `CodeSnippets` will receive all props that were passed to `<CodeSnippets>` in MDX
  CodeSnippets,
  SyncCommand,
  DocLinkList,
  YouTubeEmbed,
};
