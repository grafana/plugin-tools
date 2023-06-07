import React, { ElementType } from 'react';

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

interface Props {
  snippets: Array<{
    component: ElementType;
    label?: string;
  }>;
  groupId?: string;
  queryString?: string;
}

/*
  CodeSnippets is a component that allows you to display code snippets from the docs/snippets folder.
  It takes in an array of imported snippets you want to display, along with a label.
 */

function CodeSnippets({ snippets = [], groupId, queryString }: Props) {
  if (snippets.length === 0) {
    return null;
  }

  if (snippets.length === 1) {
    const Snippet = snippets[0].component;
    return <Snippet />;
  }

  return (
    // @ts-ignore - Tabs types appear to be broken.
    <Tabs groupId={groupId} queryString={queryString}>
      {snippets.map((snippet) => {
        const Snippet = snippet.component;
        return (
          // @ts-ignore - TabItem types appear to be broken.
          <TabItem key={snippet.label} value={snippet.label} label={snippet.label}>
            <Snippet />
          </TabItem>
        );
      })}
    </Tabs>
  );
}

export default CodeSnippets;
