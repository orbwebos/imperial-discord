import { readdir } from 'fs/promises';
import { resolve } from 'path';

export type Nullish = null | undefined;

export function isNullOrUndefined(o: unknown): o is Nullish {
  return o === null || o === undefined;
}

export function isNullishOrEmpty(o: unknown): o is Nullish | '' | [] {
  return isNullOrUndefined(o) || !(o as string | unknown[]).length;
}

export function isFunction(o: unknown): o is Function {
  return typeof o === 'function';
}

export type MaybePromise<T> = T | Promise<T>;

export async function* readdirWalk(
  path: string
): AsyncIterableIterator<string> {
  const dirents = await readdir(path, { withFileTypes: true });

  for (const dirent of dirents) {
    const rpath = resolve(path, dirent.name);

    if (dirent.isDirectory()) {
      yield* readdirWalk(rpath);
    } else {
      yield rpath;
    }
  }
}
