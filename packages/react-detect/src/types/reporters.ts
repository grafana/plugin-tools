import { Severity } from './patterns.js';
import { PluginMetadata } from './plugins.js';

export interface AnalysisResult {
  pattern: string;
  severity: Severity;
  impactLevel: 'critical' | 'warning';
  location: {
    type: 'source' | 'dependency';
    file: string;
    line: number;
    column: number;
  };
  problem: string;
  fix: {
    description: string;
    before: string;
    after: string;
  };
  link: string;
  packageName?: string;
  rootDependency?: string;
}

export interface PluginAnalysisResults {
  plugin: PluginMetadata;
  summary: {
    totalIssues: number;
    critical: number;
    warnings: number;
    sourceIssuesCount: number;
    dependencyIssuesCount: number;
    status: 'action_required' | 'no_action_required';
    affectedDependencies: string[];
    analyzedBuildTooling: boolean;
    analyzedDependencies: boolean;
  };
  issues: {
    critical: AnalysisResult[];
    warnings: AnalysisResult[];
    dependencies: DependencyIssue[];
  };
}

export interface DependencyIssue {
  packageName: string;
  version: string;
  rootDependency: string;
  issues: AnalysisResult[];
  recommendation?: {
    action: 'update' | 'replace' | 'remove';
    targetVersion?: string;
    reason: string;
  };
}

export interface MergedDependencyIssue {
  pattern: string;
  severity: Severity;
  impactLevel: 'critical' | 'warning';
  locations: Array<{
    type: 'source' | 'dependency';
    file: string;
    line: number;
    column: number;
  }>;
  problem: string;
  fix: {
    description: string;
    before: string;
    after: string;
  };
  link: string;
  packageNames: string[];
  rootDependencies: string[];
}
