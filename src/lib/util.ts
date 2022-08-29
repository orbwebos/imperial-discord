import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export function isNullOrUndefined(o: any): boolean {
  return o === null || o === undefined;
}

/**
 * @param o The object.
 * @returns Whether the object is null, undefined, an empty object, an empty array, or an empty string.
 */
export function isNothing(o: any): boolean {
  return o === null || o === undefined || o === {} || o === [] || o === '';
}

export function readdirAbsoluteSync(path: string): string[] {
  return readdirSync(path).map((file) => join(path, file));
}

export function depthTwoAbsoluteSync(path: string): string[] {
  return readdirAbsoluteSync(path).flatMap((filePath) => {
    if (statSync(filePath).isDirectory()) {
      return readdirAbsoluteSync(filePath);
    } else {
      return [filePath];
    }
  });
}
