export type Confidence = 'high' | 'medium' | 'low' | 'none' | 'unknown';
export type ComponentType = 'class' | 'function' | 'unknown';

export type PatternMatch = {
  pattern: string;
  line: number;
  column: number;
  matched: string;
  context: string;
};

export type SourceFileType = 'source' | 'dependency' | 'external';
export interface SourceFile {
  path: string;
  content: string;
  type: SourceFileType;
  packageName?: string;
  bundledFilePath: string;
}

export type SourceMatch = {
  pattern: string;
  matched: string;
  context: string;

  sourceFile: string;
  sourceLine: number;
  sourceColumn: number;

  type: 'source' | 'dependency';
  packageName?: string;

  bundledFilePath: string;
};

export type AnalyzedMatch = SourceMatch & {
  confidence: Confidence;
  componentType: ComponentType;
  rootDependency?: string;
};
