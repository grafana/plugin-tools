// Mirrors where @signalwire/docusaurus-plugin-llms-txt writes the markdown copy of each doc:
// the site root becomes `index.md`, every other page becomes `<path>.md`.
export function getMarkdownUrl(permalink: string, baseUrl: string): string {
  if (permalink === baseUrl) {
    return `${baseUrl}index.md`;
  }
  return `${permalink.replace(/\/$/, '')}.md`;
}
