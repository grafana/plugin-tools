import React, { useEffect, useState } from 'react';
import CodeBlock from '@theme/CodeBlock';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

function CodeSnippets({ paths, groupId, queryString }) {
  const snippetPaths = paths.split(',').map((path) => path.trim());
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

  return (
    <Tabs groupId={groupId} queryString={queryString}>
      {snippets.map((snippet) => (
        <TabItem key={snippet.value} value={snippet.value} label={snippet.label}>
          <CodeBlock language={snippet.language}>{snippet.code}</CodeBlock>
        </TabItem>
      ))}
    </Tabs>
  );
}

export default CodeSnippets;
