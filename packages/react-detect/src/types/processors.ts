export type Confidence = 'high' | 'medium' | 'low' | 'none' | 'unknown';
export type ComponentType = 'class' | 'function' | 'unknown';

export type RawMatch = {
  pattern: string;
  line: number;
  column: number;
  matched: string;
  context: string;
  file: string;
};

export type ResolvedMatch = RawMatch &
  (
    | { type: 'source'; sourceFile: string; sourceLine: number | null; sourceColumn: number | null }
    | {
        type: 'dependency';
        packageName: string;
        sourceFile: string;
        sourceLine: number | null;
        sourceColumn: number | null;
      }
    | { type: 'unknown'; reason: string }
  );

export type AnalyzedMatch = ResolvedMatch & {
  confidence: Confidence;
  componentType: ComponentType;
};
