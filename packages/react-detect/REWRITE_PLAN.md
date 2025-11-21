# React-Detect Package Rewrite Plan

## Executive Summary

Complete rewrite of the react-detect package with:
- **AST-based analysis** using @typescript-eslint/parser for both JavaScript and TypeScript
- **Improved architecture** with modular pipeline pattern
- **Better UX** with simplified CLI and actionable output
- **Severity-based grouping** to show what needs action now vs future

## Package Dependencies

### Add New Dependencies

```json
{
  "dependencies": {
    "@typescript-eslint/parser": "^8.46.2",
    "@typescript-eslint/typescript-estree": "^8.46.2"
  }
}
```

### Keep Existing Dependencies

```json
{
  "dependencies": {
    "@libs/output": "1.0.2",
    "chalk": "^5.3.0",
    "fast-glob": "^3.3.2",
    "minimist": "^1.2.8",
    "source-map": "^0.7.4"
  }
}
```

**Note:** Using only @typescript-eslint/parser (not acorn) because it can parse both JavaScript and TypeScript files.

## New Architecture

### Directory Structure

```
src/
├── cli/
│   ├── command.ts              # Parse CLI args, validate inputs
│   └── runner.ts               # Execute pipeline, handle errors
├── scanner/
│   ├── file-scanner.ts         # Find .js files using fast-glob
│   ├── pattern-matcher.ts      # AST-based pattern matching
│   └── pattern-definitions.ts  # Pattern configs with fix suggestions
├── parsers/
│   └── parser.ts               # @typescript-eslint/parser wrapper
├── source-maps/
│   ├── resolver.ts             # Resolve source locations
│   └── package-extractor.ts    # Extract package names from paths
├── analyzers/
│   ├── confidence-analyzer.ts  # AST-based React confidence scoring
│   ├── component-analyzer.ts   # AST-based component type detection
│   └── result-builder.ts       # Build AnalysisResult objects
├── context/
│   ├── plugin-context.ts       # Load plugin.json metadata
│   ├── dependency-context.ts   # Parse package.json
│   └── build-context.ts        # Detect externals & jsx config
├── pipeline/
│   ├── analysis-pipeline.ts    # Main orchestrator
│   └── pipeline-factory.ts     # DI factory for pipeline
├── reporters/
│   ├── console-reporter.ts     # Enhanced console output with @libs/output
│   └── json-reporter.ts        # Improved JSON schema
└── types/
    ├── pipeline-types.ts       # Pipeline stage types
    ├── pattern-types.ts        # Pattern definitions
    └── result-types.ts         # Result types with discriminated unions
```

### Key Architectural Changes

1. **Replace regex with AST** - Use @typescript-eslint/parser for accurate pattern detection
2. **Pipeline pattern** - Replace 376-line Analyzer god class with modular pipeline
3. **Dependency injection** - All dependencies injected via factory
4. **Strong typing** - Use discriminated unions instead of string unions
5. **No user-controlled filters** - Automatic filtering based on confidence, component type

## CLI Improvements

### Simplified CLI Interface

**Before (9 flags):**
```bash
npx @grafana/react-detect detect [path] \
  --pattern <name> \
  --format <type> \
  --confidence <level> \
  --source-only \
  --deps-only \
  --include-externals \
  --output <file> \
  --quiet
```

**After (4 flags):**
```bash
npx @grafana/react-detect [path] [options]

Options:
  --format <type>     Output format: console, json (default: console)
  --output <file>     Write output to file
  --quiet             Minimal output
  --help              Show help
  --version           Show version
```

**Removed flags:**
- `--pattern` - Internal detail, not user-facing
- `--confidence` - Should be automatic
- `--source-only` / `--deps-only` - Filter in output instead
- `--include-externals` - Debug flag, not needed

## Output Improvements

### Console Output Example

Group by severity to show what needs action now:

```
@grafana/react-detect - React 19 Compatibility Check

Plugin: my-plugin v1.0.0
✓ Built files analyzed: dist/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SUMMARY
  🔴 Critical Issues: 3 (breaks in React 19)
  🟡 Warnings: 2 (deprecated, still works)
  📦 Issues in dependencies: 5

  ⚠️  ACTION REQUIRED: Fix 3 critical issues before upgrading to React 19

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL - Breaks in React 19 (3 issues)

These will cause runtime errors in React 19:

  ✗ defaultProps on function component
    src/components/Panel.tsx:45

    Problem: Function components cannot use defaultProps in React 19

    Fix: Use default parameters instead
    - MyComponent.defaultProps = { value: 'test' }
    + function MyComponent({ value = 'test' }) {

    Learn more: https://react.dev/blog/.../defaultprops

  ✗ ReactDOM.render
    src/index.tsx:12

    Problem: ReactDOM.render removed in React 19

    Fix: Use createRoot instead
    - ReactDOM.render(<App />, document.getElementById('root'))
    + const root = ReactDOM.createRoot(document.getElementById('root'))
    + root.render(<App />)

    Learn more: https://react.dev/blog/.../render

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟡 WARNINGS - Deprecated (2 issues)

These still work but may be removed in future React versions:

  ⚠ Context.Provider
    src/context/ThemeContext.tsx:20

    Note: Context.Provider syntax is deprecated but still works

    Recommended: Use Context directly
    - <ThemeContext.Provider value={theme}>
    + <ThemeContext value={theme}>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 DEPENDENCY ISSUES (5 issues)

Issues found in bundled npm packages:

  react-select (3 issues)
  ├─ From: package.json → "react-select": "^5.7.0"
  ├─ 🔴 defaultProps: 3 occurrences
  │   node_modules/react-select/dist/Select.js:124
  └─ Action: Update to react-select@6.0.0+ (React 19 compatible)

  @mui/material (2 issues)
  ├─ From: package.json → "@mui/material": "^5.0.0"
  ├─ 🔴 findDOMNode: 2 occurrences
  └─ Action: Update to @mui/material@6.0.0+ (React 19 compatible)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Steps:
1. Fix 3 critical issues in your source code
2. Update 2 dependencies to React 19 compatible versions
3. Re-run this tool to verify all issues are resolved

Run with --format json for detailed results
```

### JSON Output Example

Improved schema for programmatic consumption:

```json
{
  "plugin": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "type": "panel"
  },
  "summary": {
    "totalIssues": 10,
    "critical": 3,
    "warnings": 2,
    "dependencyIssues": 5,
    "status": "action_required",
    "react19Ready": false
  },
  "issues": {
    "critical": [
      {
        "pattern": "defaultProps",
        "severity": "removed",
        "location": {
          "type": "source",
          "file": "src/components/Panel.tsx",
          "line": 45,
          "column": 10
        },
        "problem": "Function components cannot use defaultProps in React 19",
        "fix": {
          "description": "Use default parameters instead",
          "before": "MyComponent.defaultProps = { value: 'test' }",
          "after": "function MyComponent({ value = 'test' }) {"
        },
        "link": "https://react.dev/blog/.../defaultprops"
      }
    ],
    "warnings": [...],
    "dependencies": [
      {
        "package": "react-select",
        "version": "^5.7.0",
        "issueCount": 3,
        "issues": [...],
        "recommendation": {
          "action": "update",
          "targetVersion": "6.0.0+",
          "reason": "React 19 compatible"
        }
      }
    ]
  },
  "analyzedFiles": 15,
  "analyzedAt": "2025-01-15T10:30:00Z"
}
```

## Pattern Definitions with Fix Suggestions

Each pattern should include fix information:

```typescript
interface PatternDefinition {
  pattern: string;              // Pattern name/identifier
  severity: 'removed' | 'deprecated';
  impactLevel: 'critical' | 'warning';
  description: string;          // Technical description
  problem: string;              // User-friendly problem description
  fix: {
    description: string;        // How to fix it
    before: string;            // Code before
    after: string;             // Code after
  };
  link: string;                // React docs link
  functionComponentOnly?: boolean;
}

export const PATTERNS: Record<string, PatternDefinition> = {
  defaultProps: {
    pattern: 'defaultProps',
    severity: 'removed',
    impactLevel: 'critical',
    description: 'defaultProps removed for function components',
    problem: 'Function components cannot use defaultProps in React 19',
    fix: {
      description: 'Use default parameters instead',
      before: 'MyComponent.defaultProps = { value: "test" }',
      after: 'function MyComponent({ value = "test" }) { ... }'
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-defaultprops',
    functionComponentOnly: true
  },

  'ReactDOM.render': {
    pattern: 'ReactDOM.render',
    severity: 'removed',
    impactLevel: 'critical',
    description: 'ReactDOM.render removed',
    problem: 'ReactDOM.render removed in React 19',
    fix: {
      description: 'Use createRoot instead',
      before: 'ReactDOM.render(<App />, element)',
      after: 'const root = createRoot(element); root.render(<App />)'
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#removed-reactdom-render'
  },

  'Context.Provider': {
    pattern: 'Context.Provider',
    severity: 'deprecated',
    impactLevel: 'warning',
    description: 'Context.Provider is deprecated',
    problem: 'Context.Provider syntax is deprecated but still works',
    fix: {
      description: 'Use Context directly',
      before: '<ThemeContext.Provider value={theme}>',
      after: '<ThemeContext value={theme}>'
    },
    link: 'https://react.dev/blog/2024/04/25/react-19-upgrade-guide#context-provider'
  }

  // ... 10 more patterns
};
```

## Implementation Phases

### Phase 1: Foundation

1. **Install dependencies**
   ```bash
   npm install @typescript-eslint/parser @typescript-eslint/typescript-estree -w @grafana/react-detect
   ```

2. **Create type system** (`types/`)
   - Define discriminated unions for match types
   - Define pipeline stage types
   - Define pattern and result types

3. **Create parser wrapper** (`parsers/parser.ts`)
   ```typescript
   import { parse } from '@typescript-eslint/typescript-estree';

   export class Parser {
     parse(code: string, filePath: string) {
       return parse(code, {
         filePath,
         jsx: true,
         loc: true,
         range: true,
         ecmaVersion: 'latest',
         sourceType: 'module',
       });
     }
   }
   ```

4. **Create pattern definitions** (`scanner/pattern-definitions.ts`)
   - Migrate all 13 patterns from current implementation
   - Add fix information to each

### Phase 2: Core Logic

5. **Create context loaders** (`context/`)
   - Plugin context (load plugin.json)
   - Dependency context (parse package.json)
   - Build context (externals & jsx config detection)

6. **Create file scanner** (`scanner/file-scanner.ts`)
   - Use fast-glob to find .js files

7. **Create AST pattern matcher** (`scanner/pattern-matcher.ts`)
   - Parse files with @typescript-eslint/parser
   - Traverse AST to find patterns
   - Example for defaultProps:
   ```typescript
   function findDefaultProps(ast: AST): Match[] {
     const matches: Match[] = [];

     visit(ast, {
       MemberExpression(node) {
         if (
           node.property.type === 'Identifier' &&
           node.property.name === 'defaultProps'
         ) {
           // Check if it's being assigned to
           const parent = getParent(node);
           if (parent.type === 'AssignmentExpression') {
             matches.push({
               pattern: 'defaultProps',
               line: node.loc.start.line,
               column: node.loc.start.column,
               node
             });
           }
         }
       }
     });

     return matches;
   }
   ```

8. **Create source map resolver** (`source-maps/`)
   - Keep existing logic for resolving original source locations
   - Keep pnpm support, scoped package handling

9. **Create AST-based analyzers** (`analyzers/`)
   - Confidence analyzer: Parse TS source with AST, look for React indicators
   - Component analyzer: Parse TS source with AST, detect class vs function
   - Result builder: Aggregate results with severity grouping

### Phase 3: Pipeline

10. **Create pipeline orchestrator** (`pipeline/analysis-pipeline.ts`)
    ```typescript
    class AnalysisPipeline {
      async analyze(config: AnalysisConfig): Promise<PluginAnalysisResults> {
        // 1. Load contexts
        // 2. Scan files
        // 3. Find patterns (AST)
        // 4. Resolve source maps
        // 5. Analyze (confidence + component type)
        // 6. Auto-filter (confidence, class components, externals)
        // 7. Group by severity
        // 8. Build results
      }
    }
    ```

11. **Create pipeline factory** (`pipeline/pipeline-factory.ts`)
    - DI factory to wire up all dependencies

### Phase 4: CLI & Reporting

12. **Create enhanced reporters** (`reporters/`)
    - Console reporter with severity grouping, fix suggestions
    - JSON reporter with improved schema
    - Remove CSV reporter

13. **Create simplified CLI** (`cli/`)
    - Parse args with minimist
    - Validate inputs
    - Execute pipeline
    - Handle errors

### Phase 5: Testing

14. **Update tests**
    - Rewrite test assertions for new structure
    - Keep test fixtures
    - Add tests for new features (severity grouping, fix suggestions)

15. **Update README**
    - Document new CLI
    - Update examples

## Pipeline Data Flow

```
1. Load Contexts
   ↓
2. Scan Files (fast-glob)
   ↓
3. Pattern Matching (AST)
   Files → Parse with TS-ESLint → Traverse AST → Find patterns → RawMatch[]
   ↓
4. Source Map Resolution
   RawMatch[] → Resolve original location → ResolvedMatch[]
   ↓
5. Analysis (for TypeScript source only)
   ResolvedMatch[] → Parse TS source → Analyze confidence + component type → AnalyzedMatch[]
   ↓
6. Auto-Filtering
   AnalyzedMatch[] → Filter low confidence → Filter class defaultProps → Filter externals → FilteredMatch[]
   ↓
7. Severity Grouping
   FilteredMatch[] → Group by (critical/warning) × (source/dependency) → GroupedResults
   ↓
8. Build Final Results
   GroupedResults → Add fix suggestions → Add recommendations → PluginAnalysisResults
```

## AST Traversal Examples

### Finding defaultProps

```typescript
visit(ast, {
  AssignmentExpression(node) {
    // Check if left side is MemberExpression with property 'defaultProps'
    if (
      node.left.type === 'MemberExpression' &&
      node.left.property.type === 'Identifier' &&
      node.left.property.name === 'defaultProps'
    ) {
      return {
        pattern: 'defaultProps',
        line: node.loc.start.line,
        column: node.loc.start.column
      };
    }
  }
});
```

### Finding ReactDOM.render

```typescript
visit(ast, {
  CallExpression(node) {
    // Check if it's ReactDOM.render()
    if (
      node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'ReactDOM' &&
      node.callee.property.type === 'Identifier' &&
      node.callee.property.name === 'render'
    ) {
      return {
        pattern: 'ReactDOM.render',
        line: node.loc.start.line,
        column: node.loc.start.column
      };
    }
  }
});
```

### Component Type Detection

```typescript
function detectComponentType(ast: AST): ComponentType {
  let classIndicators = 0;
  let functionIndicators = 0;

  visit(ast, {
    ClassDeclaration(node) {
      // Check if extends React.Component
      if (
        node.superClass?.type === 'MemberExpression' &&
        node.superClass.object.name === 'React' &&
        node.superClass.property.name === 'Component'
      ) {
        classIndicators += 3;
      }
    },

    FunctionDeclaration(node) {
      // Check if returns JSX
      const returnStatement = findReturnStatement(node);
      if (returnStatement && isJSXElement(returnStatement.argument)) {
        functionIndicators += 2;
      }
    },

    CallExpression(node) {
      // Check for hooks (useState, useEffect, etc.)
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name.startsWith('use')
      ) {
        functionIndicators += 3;
      }
    }
  });

  if (classIndicators >= 2) return 'class';
  if (functionIndicators >= 2) return 'function';
  return 'unknown';
}
```

## Exit Code Behavior

**Changed from current:**
- **Current**: Exit 1 only if plugin source has issues
- **New**: Exit 1 if ANY issues found (source or dependencies)

**Rationale:** Plugin cannot upgrade to React 19 if dependencies have breaking changes.

## Success Criteria

### Must Work
- ✅ All 13 React 19 patterns detected accurately
- ✅ Source maps resolve correctly (pnpm, scoped packages, etc.)
- ✅ Component type detection works (class vs function)
- ✅ Confidence scoring filters false positives
- ✅ AST parsing handles bundled JS and TS source
- ✅ Exit 1 for any issues (source or dependencies)
- ✅ Typecheck passes with zero errors
- ✅ No `any` types

### Improved UX
- ✅ Simplified CLI (4 flags instead of 9)
- ✅ Summary shows action-required status at top
- ✅ Issues grouped by severity (critical → warning)
- ✅ Each issue shows how to fix it
- ✅ Dependency issues show update recommendations
- ✅ Better visual hierarchy in console output
- ✅ JSON schema is more useful

### Architecture
- ✅ Modular pipeline pattern
- ✅ AST-based analysis
- ✅ Dependency injection
- ✅ No modules over 150 lines
- ✅ Clear separation of concerns

## Quick Start

1. **Install dependencies**
   ```bash
   cd packages/react-detect
   npm install @typescript-eslint/parser @typescript-eslint/typescript-estree
   ```

2. **Create directory structure**
   ```bash
   mkdir -p src/{cli,scanner,parsers,source-maps,analyzers,context,pipeline,reporters,types}
   ```

3. **Start with types**
   - Create strong type definitions first
   - This guides the implementation

4. **Then parser**
   - Get AST parsing working
   - Test with sample code

5. **Then scanner**
   - Implement pattern matching
   - Test finding patterns in bundled code

6. **Continue through phases**
   - Build from bottom up
   - Test each module individually

## Notes

- The @typescript-eslint/parser can parse both JS and TS, so we only need one parser
- Use @libs/output for all terminal output (consistent with other Grafana tools)
- Keep existing logic for externals detection and jsx config detection
- AST traversal can be done with simple recursive functions or visitor pattern
- Source map resolution logic stays mostly the same
- Confidence scoring and component detection become more accurate with AST

## References

- TypeScript ESLint Parser: https://typescript-eslint.io/packages/parser
- ESTree AST Spec: https://github.com/estree/estree
- React 19 Upgrade Guide: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
