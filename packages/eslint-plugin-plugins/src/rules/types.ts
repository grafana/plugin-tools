import type { Exports } from '@grafana/levitate';
import { Program } from 'typescript';

export type ExportInfo = { exports: Exports; program: Program };

export type MessageIds = 'issue:import';

export type Options = [
  Partial<{
    minGrafanaVersion: string;
  }>,
];
