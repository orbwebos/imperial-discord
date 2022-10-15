import { Component } from './component';
import { ExtendedCollection } from './extended_collection';
import { readdirDepthTwoAbsoluteSync } from './util';

export interface RecordOptions {
  name: string;
  path: string;
  discriminator: string;
}

export class Record<V extends Component> extends ExtendedCollection<string, V> {
  public name: string;
  public path: string;
  public discriminator: string;

  public constructor(options: RecordOptions) {
    super();

    this.name = options.name;
    this.path = options.path;
    this.discriminator = options.discriminator.toLowerCase();
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
    const files = readdirDepthTwoAbsoluteSync(this.path).filter((filePath) =>
      filePath.endsWith('.js')
    );

    for (const filePath of files) {
      this.sync(filePath);
    }
  }

  public async unsyncAll() {
    for (const key of this.keys()) {
      this.unsync(key);
    }
  }
}
