import chalk from 'chalk';
import { EOL } from 'os';

type Colors = 'red' | 'cyan' | 'green' | 'yellow' | 'gray';

type TaskStatus = 'success' | 'failure' | 'skipped';

function isCI() {
  return (
    (process.env.CI && process.env.CI !== 'false') || // Drone CI plus others
    process.env.GITHUB_ACTIONS === 'true' // GitHub Actions
  );
}

if (isCI()) {
  // Disable coloring when running in CI environments.
  chalk.level = 0;
}

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
    const separator = chalk.dim[color](this.separator);
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
        return chalk.green('✓');
      case 'failure':
        return chalk.red('⨯');
      case 'skipped':
        return chalk.yellow('−');
    }
  }

  private addPrefix(color: Colors, text: string) {
    const namePrefix = chalk.reset.inverse.bold[color](` ${this.appName} `);
    if (!this.appVersion) {
      return `${namePrefix} ${text}`;
    }
    const nameAndVersionPrefix = chalk.reset.inverse.bold[color](` ${this.appName}@${this.appVersion} `);
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
    this.writeTitle('red', chalk.red.bold(title), withPrefix);
    this.writeBody(body);

    if (link) {
      this.addNewLine();
      this.write(`${chalk.gray('Learn more about this error: ')}
  ${chalk.cyan(link)}`);
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
    this.writeTitle('yellow', chalk.yellow.bold(title), withPrefix);
    this.writeBody(body);

    if (link) {
      this.addNewLine();
      this.write(`${chalk.gray('Learn more about this warning: ')}
  ${this.formatUrl(link)}`);
    }
    this.addNewLine();
  }

  success({ title, body, withPrefix = true }: { title: string; body?: string[]; withPrefix?: boolean }) {
    this.addNewLine();
    this.writeTitle('green', chalk.green.bold(title), withPrefix);
    this.writeBody(body);
    this.addNewLine();
  }

  log({ title, body, withPrefix = true }: { title: string; body?: string[]; withPrefix?: boolean }) {
    this.addNewLine();
    this.writeTitle('cyan', chalk.cyan.bold(title), withPrefix);
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
    return chalk.italic.cyan(code);
  }

  formatUrl(url: string) {
    return chalk.reset.blue.underline(url);
  }

  statusList(status: TaskStatus, list: string[]) {
    return list.map((item) => {
      return ` ${this.getStatusIcon(status)} ${item}`;
    });
  }
}
