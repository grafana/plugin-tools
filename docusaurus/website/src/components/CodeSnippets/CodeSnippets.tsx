import React, { useEffect, useState } from 'react';
import CodeBlock from '@theme/CodeBlock';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

/*
  CodeSnippets is a component that allows you to display code snippets from the docs/snippets folder.
  It takes in an array of paths to the snippets you want to display, and will display them in a tabbed
  interface. The paths should be relative to the docs/snippets folder, and should include the file extension.

  Snippets should be named in the following format: <name>.<value>.<language>.<extension>
  `value` is used for the tabs unique value and label.
  language is used for syntax highlighting.
 */

function CodeSnippets({ paths, groupId, queryString }: { paths: string[]; groupId?: string; queryString?: string }) {
  const snippetPaths = paths.map((path) => path.trim());
  const [snippets, setSnippets] = useState([]);

  useEffect(() => {
    async function fetchSnippets() {
      const fetchedSnippets = await Promise.all(
        snippetPaths.map(async (path) => {
          const [_, value, language] = path.split('.');
          try {
            const code = (await import(`!!raw-loader!@site/../docs/snippets/${path}`)).default;

            return {
              language,
              value,
              label: value.toUpperCase(),
              code,
            };
          } catch (error) {
            console.log(`CodeSnippets failed to load: docs/snippets/${path}`, error);
            return null;
          }
        })
      );
      setSnippets(fetchedSnippets.filter((snippet) => snippet != null));
    }

    fetchSnippets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (snippets.length === 0) {
    return null;
  }

  if (snippets.length === 1) {
    return <CodeBlock language={snippets[0].language}>{snippets[0].code}</CodeBlock>;
  }

  return (
    // @ts-ignore - Tabs types appear to be broken.
    <Tabs groupId={groupId} queryString={queryString}>
      {snippets.map((snippet) => (
        // @ts-ignore - TabItem types appear to be broken.
        <TabItem key={snippet.value} value={snippet.value} label={snippet.label}>
          <CodeBlock language={snippet.language}>{snippet.code}</CodeBlock>
        </TabItem>
      ))}
    </Tabs>
  );
}

export default CodeSnippets;
