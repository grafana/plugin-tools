import { styleText } from 'node:util';
import { EOL } from 'os';

type Colors = 'red' | 'cyan' | 'green' | 'yellow' | 'gray';

type TaskStatus = 'success' | 'failure' | 'skipped';

// TODO: check to see if we still need this
// function isCI() {
//   return (
//     (process.env.CI && process.env.CI !== 'false') || // Drone CI plus others
//     process.env.GITHUB_ACTIONS === 'true' // GitHub Actions
//   );
// }

// if (isCI()) {
//   // Disable coloring when running in CI environments.
//   process.env.NODE_DISABLE_COLORS = 'true';
// }

export class Output {
  private appName: string;
  private appVersion?: string;

  constructor(name: string, version?: string) {
    this.appName = name;
    this.appVersion = version;
  }

  private write(str: string) {
    process.stdout.write(str);
  }

  private get separator() {
    let separator = '';
    for (let i = 0; i < process.stdout.columns - 1; i++) {
      separator += '\u2014';
    }
    return separator;
  }

  addHorizontalLine(color: Colors) {
    const separator = styleText(['dim', color], this.separator);
    this.write(`${separator}${EOL}`);
  }

  addNewLine() {
    this.write(EOL);
  }

  private writeTitle(color: Colors, title: string, withPrefix = true) {
    if (withPrefix) {
      this.write(`${this.addPrefix(color, title)}${EOL}`);
    } else {
      this.write(`${title}${EOL}`);
    }
  }

  private getStatusIcon(taskStatus: TaskStatus) {
    switch (taskStatus) {
      case 'success':
        return styleText(['green'], '✓');
      case 'failure':
        return styleText(['red'], '⨯');
      case 'skipped':
        return styleText(['yellow'], '−');
    }
  }

  private addPrefix(color: Colors, text: string) {
    const namePrefix = styleText(['reset', 'inverse', 'bold', color], ` ${this.appName} `);
    if (!this.appVersion) {
      return `${namePrefix} ${text}`;
    }
    const nameAndVersionPrefix = styleText(['reset', 'inverse', 'bold', color], ` ${this.appName}@${this.appVersion} `);
    return `${nameAndVersionPrefix} ${text}`;
  }

  private writeBody(body?: string[]) {
    if (!body) {
      return;
    }
    this.addNewLine();
    body.forEach((line) => {
      this.write(`${line}${EOL}`);
    });
  }

  error({
    title,
    body,
    link,
    withPrefix = true,
  }: {
    title: string;
    body?: string[];
    link?: string;
    withPrefix?: boolean;
  }) {
    this.addNewLine();
    this.writeTitle('red', styleText(['red', 'bold'], title), withPrefix);
    this.writeBody(body);

    if (link) {
      this.addNewLine();
      this.write(`${styleText(['gray'], 'Learn more about this error: ')}
  ${styleText(['cyan'], link)}`);
    }
    this.addNewLine();
  }

  warning({
    title,
    body,
    link,
    withPrefix = true,
  }: {
    title: string;
    body?: string[];
    link?: string;
    withPrefix?: boolean;
  }) {
    this.addNewLine();
    this.writeTitle('yellow', styleText(['yellow', 'bold'], title), withPrefix);
    this.writeBody(body);

    if (link) {
      this.addNewLine();
      this.write(`${styleText(['gray'], 'Learn more about this warning: ')}
  ${this.formatUrl(link)}`);
    }
    this.addNewLine();
  }

  success({ title, body, withPrefix = true }: { title: string; body?: string[]; withPrefix?: boolean }) {
    this.addNewLine();
    this.writeTitle('green', styleText(['green', 'bold'], title), withPrefix);
    this.writeBody(body);
    this.addNewLine();
  }

  log({ title, body, withPrefix = true }: { title: string; body?: string[]; withPrefix?: boolean }) {
    this.addNewLine();
    this.writeTitle('cyan', styleText(['cyan', 'bold'], title), withPrefix);
    this.writeBody(body);
    this.addNewLine();
  }

  logSingleLine(message: string) {
    this.addNewLine();
    this.write(message);
    this.addNewLine();
  }

  bulletList(list: string[]) {
    return list.map((item) => {
      return ` • ${item}`;
    });
  }

  formatCode(code: string) {
    return styleText(['italic', 'cyan'], code);
  }

  formatUrl(url: string) {
    return styleText(['reset', 'blue', 'underline'], url);
  }

  statusList(status: TaskStatus, list: string[]) {
    return list.map((item) => {
      return ` ${this.getStatusIcon(status)} ${item}`;
    });
  }
}
