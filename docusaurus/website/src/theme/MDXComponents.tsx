import React from 'react';
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
import CodeSnippets from '@site/src/components/CodeSnippets/CodeSnippets';
import SyncCommand from '@site/src/components/SyncCommand/SyncCommand';
import DocLinkList from '@site/src/components/DocLinkList/DocLinkList';

export default {
  // Re-use the default mapping
  ...MDXComponents,
  // Map the "<CodeSnippets>" tag to our CodeSnippets component
  // `CodeSnippets` will receive all props that were passed to `<CodeSnippets>` in MDX
  CodeSnippets,
  SyncCommand,
  DocLinkList,
};
