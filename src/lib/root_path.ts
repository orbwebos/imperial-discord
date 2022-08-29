import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function readFromPackageJson(property: string): string {
  const cwd = process.cwd();

  const file = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
  return file[property];
}

export function getProcessPath(): string {
  const cwd = process.cwd();

  return dirname(join(cwd, readFromPackageJson('main')));
}

export function getVersion(): string {
  return readFromPackageJson('version');
}
