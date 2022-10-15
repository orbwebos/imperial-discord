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
import { getProcessPath } from './root_path';
import { readdirWalk } from './util';

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

export async function allCommandReferences(
  commandsPath: string
): Promise<CommandReference[]> {
  const paths: string[] = [];
  for await (const path of readdirWalk(commandsPath)) {
    paths.push(path);
  }

  return paths
    .map((path) => {
      const content = readFileSync(path).toString().trim();

      return { path: content.split('\n')[0], hash: basename(path) };
    })
    .filter((command) => command);
}

export async function lookUpCommandReference(
  hash: string
): Promise<CommandReference> {
  const reference = (await allCommandReferences(commandsReferencesPath)).find(
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

export async function upsertCommandReference(
  commandPath: string,
  hash: string
): Promise<CommandReference> {
  const references = await allCommandReferences(commandsReferencesPath);

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

export async function removeStaleReferences(): Promise<CommandReference[]> {
  const deleted: CommandReference[] = [];

  for (const reference of await allCommandReferences(commandsReferencesPath)) {
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

    const reference = await lookUpCommandReference(hash);
    const newReference = await upsertCommandReference(path, hash);

    if (reference.hash === newReference.hash) {
      restrictedPaths.push(path);
    }
  }

  removeStaleReferences();

  return commands.filter(
    (command) => !restrictedPaths.includes(command.environment.path)
  );
}
