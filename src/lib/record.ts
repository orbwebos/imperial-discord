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

  public syncAll() {
    const files = readdirDepthTwoAbsoluteSync(this.path).filter((filePath) =>
      filePath.endsWith('.js')
    );

    files.forEach((filePath) => {
      const raw = require(filePath);
      this.base.logger.trace(raw);
      const name = Object.keys(raw).find((s) =>
        s.toLowerCase().endsWith(this.discriminator)
      );

      const ComponentCtor = raw[name] as new () => V;
      const component = new ComponentCtor();

      if (typeof component['init'] === 'function') {
        component['init']();
      }

      this.set(component['name'] ?? name, component);
    });
  }
}
