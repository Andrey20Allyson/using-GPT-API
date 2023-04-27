import { ReadStream, WriteStream } from "node:tty";

export type ObjectRef<T> = {
  currenty: T;
}

export interface ProgressWriterOptions {
  startRef?: ObjectRef<number>;
  stdout: WriteStream;
}

export const END_LINE = '\n';
export function endLine(count: number = 1) {
  return count === 1 ? END_LINE : END_LINE.repeat(count);
}  

export function progressWriter(text: string, options: ProgressWriterOptions) {
  const {
    stdout = process.stdout,
    startRef,
  } = options;

  process.stdout.write(text.slice(startRef?.currenty));

  if (startRef) startRef.currenty = text.length;
}

export interface PromptOptions {
  stdout?: WriteStream;
  stdin?: ReadStream;
}

export function stringfyInput(data: Buffer) {
  return data.toString('utf-8').replace(/[\r\n]+$/, '');
}

export function prompt(label: string, options?: PromptOptions) {
  const {
    stdin = process.stdin,
    stdout = process.stdout,
  } = options ?? {};

  return new Promise<string>((resolve, reject) => {
    stdout.write(label);

    stdin.resume();

    stdin.once('data', data => {
      const text = stringfyInput(data);

      stdin.pause();

      resolve(text);
    });

    stdin.once('error', reject);
  })
}