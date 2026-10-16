const strictUtf8 = new TextDecoder('utf-8', { fatal: true });

/** The body as text, or undefined when it isn't valid UTF-8 and must be kept as raw bytes. */
export function decodeUtf8Strict(bytes: Buffer): string | undefined {
  try {
    return strictUtf8.decode(bytes);
  } catch {
    return undefined;
  }
}
