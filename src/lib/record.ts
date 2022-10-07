import { Component } from './component';
import { ExtendedCollection } from './extended_collection';

export class Record<K, V extends Component> extends ExtendedCollection<K, V> {
  public path: string;

  public constructor(path: string) {
    super();

    this.path = path;
  }
}
