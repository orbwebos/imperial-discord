import { CommandRecord } from './command_record';
import { ExtendedCollection } from './extended_collection';
import { HandlerRecord } from './handler_record';

export type RecordUnion = CommandRecord | HandlerRecord;

export class RecordManager extends ExtendedCollection<string, RecordUnion> {
  public add(record: RecordUnion): this {
    this.set(record.name, record);

    return this;
  }
}
