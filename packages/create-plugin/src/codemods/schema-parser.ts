import * as v from 'valibot';

/**
 * Parse and validate options using Valibot schema
 * Valibot handles parsing, validation, type coercion, and defaults automatically
 */
export function parseAndValidateOptions<T extends v.BaseSchema<any, any, any>>(
  options: Record<string, any>,
  schema: T
): v.InferOutput<T> {
  try {
    return v.parse(schema, options);
  } catch (error) {
    if (v.isValiError(error)) {
      // format Valibot validation errors
      const formattedErrors = error.issues
        .map((issue) => {
          const path = issue.path?.map((p) => p.key).join('.') || '';
          return `  --${path}: ${issue.message}`;
        })
        .join('\n');

      throw new Error(`Invalid flag(s) provided:\n\n${formattedErrors}`);
    }
    throw error;
  }
}
