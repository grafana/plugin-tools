import React from 'react';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { getMarkdownUrl } from './getMarkdownUrl';

export function ViewAsMarkdown() {
  const { metadata } = useDoc();
  const { siteConfig } = useDocusaurusContext();
  const href = getMarkdownUrl(metadata.permalink, siteConfig.baseUrl);

  return (
    <div className="doc-actions">
      {/* Plain <a> so the router doesn't try to resolve the .md file as a page. */}
      <a href={href} target="_blank" rel="noreferrer">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M14.85 3c.63 0 1.15.52 1.14 1.15v7.7c0 .63-.51 1.15-1.15 1.15H1.15C.52 13 0 12.48 0 11.84V4.15C0 3.52.52 3 1.15 3ZM9 11V5H7L5.5 7 4 5H2v6h2V8l1.5 1.92L7 8v3Zm2.99.5L14.5 8H13V5h-2v3H9.5Z" />
        </svg>
        View as Markdown
      </a>
    </div>
  );
}
