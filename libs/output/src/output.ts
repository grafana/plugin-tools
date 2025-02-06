import chalk from 'chalk';
import { EOL } from 'os';

type Colors = 'red' | 'cyan' | 'green' | 'yellow';

export class Output {
  private appName: string;
  private appVersion: string;

  constructor(name: string, version: string) {
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
    this.addNewLine();
    this.write(`${separator}${EOL}`);
    this.addNewLine();
  }

  addNewLine() {
    this.write(EOL);
  }

  private writeTitle(color: Colors, title: string) {
    this.write(`${this.addPrefix(color, title)}${EOL}`);
  }

  private addPrefix(color: Colors, text: string) {
    const namePrefix = chalk.reset.inverse.bold[color](` ${this.appName} `);
    const versionPrefix = chalk.reset[color](`v${this.appVersion}`);
    return `${namePrefix} ${versionPrefix} ${text}`;
  }

  private writeBody(body?: string[]) {
    if (!body) {
      return;
    }
    body.forEach((line) => {
      this.write(`${line}${EOL}`);
    });
  }

  error({ title, body, link }: { title: string; body?: string[]; link?: string }) {
    this.addNewLine();
    this.writeTitle('red', chalk.red.bold(title));
    this.addNewLine();
    this.writeBody(body);

    if (link) {
      this.addNewLine();
      this.write(`${chalk.gray('For more information about this error: ')}
  ${link}${EOL}`);
    }

    this.addNewLine();
  }

  warning({ title, body }: { title: string; body?: string[] }) {
    this.addNewLine();
    this.writeTitle('yellow', chalk.yellow(title));
    this.writeBody(body);
    this.addNewLine();
  }

  success({ title, body }: { title: string; body?: string[] }) {
    this.addNewLine();
    this.writeTitle('green', chalk.green(title));
    this.writeBody(body);
    this.addNewLine();
  }

  log({ title, body, color }: { title: string; body?: string[]; color?: Colors }) {
    this.addNewLine();
    this.writeTitle('cyan', color ? chalk[color](title) : title);
    this.writeBody(body);
    this.addNewLine();
  }
}
