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
    | {
        type: 'source';
        sourceFile: string;
        sourceLine?: number;
        sourceColumn?: number;
        sourceContent?: string;
        sourceContext?: string;
      }
    | {
        type: 'dependency';
        packageName: string;
        sourceFile: string;
        sourceLine?: number;
        sourceColumn?: number;
        sourceContent?: string;
        sourceContext?: string;
      }
    | { type: 'unknown'; reason: string }
  );

export type AnalyzedMatch = ResolvedMatch & {
  confidence: Confidence;
  componentType: ComponentType;
} & ({ type: 'source' } | { type: 'dependency'; rootDependency: string } | { type: 'unknown' });
