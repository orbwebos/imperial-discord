import { Component } from './component';
import { ExtendedCollection } from './extended_collection';
import { readdirDepthTwoAbsoluteSync } from './util';

export class Record<V extends Component> extends ExtendedCollection<string, V> {
  public path: string;
  public discriminator: string;

  public constructor(path: string, discriminator: string) {
    super();

    this.path = path;
    this.discriminator = discriminator.toLowerCase();
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
