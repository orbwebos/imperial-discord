import {
  readFileSync,
  existsSync,
  statSync,
  unlinkSync,
  writeFileSync,
  renameSync,
  mkdirSync,
} from 'fs';
import { basename, join } from 'path';
import { createHash } from 'crypto';
import { CommandRecord } from './command_record';
import { Command } from './command';
import { readdirAbsoluteSync } from './util';
import { getProcessPath } from './root_path';

const commandsReferencesPath = join(
  getProcessPath(),
  '..',
  '.imperial/commands'
);

export function sha1(s: string): string {
  const H = createHash('sha1');
  return H.update(s).digest('hex');
}

export interface CommandReference {
  path: string;
  hash: string;
}

export function allCommandReferences(commandsPath: string): CommandReference[] {
  const paths = readdirAbsoluteSync(commandsPath);

  return paths
    .map((path) => {
      const content = readFileSync(path).toString().trim();

      return { path: content.split('\n')[0], hash: basename(path) };
    })
    .filter((command) => command);
}

export function lookUpCommandReference(hash: string): CommandReference {
  const reference = allCommandReferences(commandsReferencesPath).find(
    (reference) => reference.hash === hash
  );

  return reference ?? { path: null, hash: null };
}

function newReferencePath(hash: string): string {
  return join(commandsReferencesPath, hash);
}

function pathToReference(reference: CommandReference): string {
  return newReferencePath(reference.hash);
}

export function upsertCommandReference(
  commandPath: string,
  hash: string
): CommandReference {
  const references = allCommandReferences(commandsReferencesPath);

  for (const reference of references) {
    if (reference.path === commandPath && reference.hash === hash) {
      return reference;
    }

    if (reference.path === commandPath && reference.hash !== hash) {
      renameSync(pathToReference(reference), newReferencePath(hash));

      return { path: commandPath, hash };
    }

    if (reference.path !== commandPath && reference.hash === hash) {
      unlinkSync(pathToReference(reference));
    }
  }

  writeFileSync(newReferencePath(hash), commandPath);

  return { path: commandPath, hash };
}

export function removeStaleReferences(): CommandReference[] {
  const deleted: CommandReference[] = [];

  for (const reference of allCommandReferences(commandsReferencesPath)) {
    if (!existsSync(reference.path) || !statSync(reference.path).isFile()) {
      deleted.push(reference);

      unlinkSync(pathToReference(reference));
    }
  }

  return deleted;
}

export async function defaultRegisteringSelector(
  record: CommandRecord
): Promise<Command[]> {
  const commands = record.valuesToArray();

  const commandPaths = commands.map((command) => command.environment.path);

  mkdirSync(commandsReferencesPath, { recursive: true });

  const restrictedPaths: string[] = [];
  for (const path of commandPaths) {
    const hash = sha1(readFileSync(path).toString());

    const reference = lookUpCommandReference(hash);
    const newReference = upsertCommandReference(path, hash);

    if (reference.hash === newReference.hash) {
      restrictedPaths.push(path);
    }
  }

  removeStaleReferences();

  return commands.filter(
    (command) => !restrictedPaths.includes(command.environment.path)
  );
}
