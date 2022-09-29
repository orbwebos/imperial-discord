import { readdirSync, statSync } from 'fs';
import { join } from 'path';

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

export function readdirAbsoluteSync(path: string): string[] {
  return readdirSync(path).map((file) => join(path, file));
}

export function readdirDepthTwoAbsoluteSync(path: string): string[] {
  return readdirAbsoluteSync(path).flatMap((filePath) =>
    statSync(filePath).isDirectory()
      ? readdirAbsoluteSync(filePath)
      : [filePath]
  );
}
