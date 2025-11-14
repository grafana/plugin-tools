import type { Context } from './context.js';
import type * as v from 'valibot';

// used as a generic constraint for codemod schemas. accepts any input, output and error types
type AnySchema = v.BaseSchema<any, any, any>;

export interface CodemodModule<TSchema extends AnySchema = AnySchema> {
  default: (context: Context, options: v.InferOutput<TSchema>) => Context | Promise<Context>;
  schema?: TSchema;
}

export interface Codemod {
  name: string;
  description: string;
  scriptPath: string;
}
