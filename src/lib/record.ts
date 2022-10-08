import { Component } from './component';
import { ExtendedCollection } from './extended_collection';
import { readdirDepthTwoAbsoluteSync } from './util';

export class Record<K, V extends Component> extends ExtendedCollection<K, V> {
  public path: string;
  public discriminator: string;

  public constructor(path: string, discriminator: string) {
    super();

    this.path = path;
    this.discriminator = discriminator.toLowerCase();
  }

  public async syncAll() {
    const files = readdirDepthTwoAbsoluteSync(this.path).filter((filePath) =>
      filePath.endsWith('.js')
    );

    for (const filePath of files) {
      const raw = require(filePath);
      const name = Object.keys(raw).find((s) =>
        s.toLowerCase().endsWith(this.discriminator)
      );

      const ComponentCtor = raw[name] as new () => V;
      const component = new ComponentCtor();
      await component.syncHook();

      this.set(component['name'] ?? name, component);
    }
  }
}
