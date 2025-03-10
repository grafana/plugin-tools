# Libs/Output

A utility library providing consistent terminal output formatting with support for colors, status icons, and branded prefixes.

## Usage

Instantiate the Output class with the cli name and optionally a version.

### Constructor

```typescript
import { Output } from '@libs/output';

const output = new Output('MyApp', '1.0.0');
```

### Methods

#### Message Output

- `success({ title: string, body?: string[], withPrefix?: boolean })` - Displays a success message in green
- `error({ title: string, body?: string[], link?: string, withPrefix?: boolean })` - Displays an error message in red with optional help link
- `warning({ title: string, body?: string[],link?: string, withPrefix?: boolean })` - Displays a warning message in yellow
- `log({ title: string, body?: string[], color?: Colors, withPrefix?: boolean })` - Displays a message with optional color

#### Formatting

- `addHorizontalLine(color: Colors)` - Adds a horizontal separator line in specified color
- `addNewLine()` - Adds a line break
- `bulletList(list: string[])` - Formats an array of strings as bullet points
- `statusList(status: TaskStatus, list: string[])` - Formats an array of strings with status icons (e.g. ✔️ for success)

#### Types

```typescript
type Colors = 'red' | 'cyan' | 'green' | 'yellow' | 'gray';
type TaskStatus = 'success' | 'failure' | 'skipped';
```

### Example Usage

```typescript
const output = new Output('MyApp', '1.0.0');

output.success({
  title: 'Build completed',
  body: output.statusList('success', ['dist folder created', 'types generated']),
});

output.error({
  title: 'Build failed',
  body: ['Unable to resolve dependencies'],
  link: 'https://example.com/troubleshooting',
});
```
