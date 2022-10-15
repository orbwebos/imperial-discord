import { Component } from './component';
import { ExtendedCollection } from './extended_collection';
import { readdirWalk } from './util';
import { resolve } from 'path';

export interface RecordOptions {
  name: string;
  paths?: string[];
  discriminator: string;
}

export class Record<V extends Component> extends ExtendedCollection<string, V> {
  public name: string;
  public paths: Set<string>;
  public discriminator: string;

  public constructor(options: RecordOptions) {
    super();

    this.name = options.name;
    this.paths = new Set(options.paths ?? []);
    this.discriminator = options.discriminator.toLowerCase();
  }

  public addPath(path: string): this {
    const r = resolve(path);

    this.paths.add(r);

    return this;
  }

  public async sync(path: string) {
    const raw = require(path);
    const name = Object.keys(raw).find((s) =>
      s.toLowerCase().endsWith(this.discriminator)
    );

    const ComponentCtor = raw[name] as new () => V;
    const component = new ComponentCtor();
    await component.syncHook();

    this.set(component['name'] ?? name, component);

    return component;
  }

  public async unsync(name: string) {
    const component = this.get(name);

    if (!component) {
      throw new Error(`No component by the name "${name}" was found to unsync`);
    }

    this.delete(name);
    component.unsyncHook();

    return component;
  }

  public async syncAll() {
    await this.unsyncAll();

    for (const path of this.paths) {
      for await (const commandPath of readdirWalk(path)) {
        if (commandPath.endsWith('.js')) {
          await this.sync(commandPath);
        }
      }
    }
  }

  public async unsyncAll() {
    for (const key of this.keys()) {
      this.unsync(key);
    }
  }
}
