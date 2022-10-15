import { CommandRecord } from './command_record';
import { Component } from './component';
import { ExtendedCollection } from './extended_collection';
import { HandlerRecord } from './handler_record';
import { Record } from './record';

type RecordKey = keyof Records;
type RecordValue = Records[keyof Records];

export class RecordManager extends ExtendedCollection<RecordKey, RecordValue> {
  public get<K extends RecordKey>(key: K): Records[K] {
    return super.get(key) as Records[K];
  }

  public add<T extends Component>(record: Record<T>): this {
    this.set(record.name as RecordKey, record as unknown as RecordValue);

    return this;
  }
}

export interface Records {
  commands: CommandRecord;
  handlers: HandlerRecord;
}
