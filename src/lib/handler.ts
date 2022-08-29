import { Base } from './base';

export interface HandlerOptions {
  name?: string;
  once?: boolean;
}

export class Handler extends Base {
  public name: string = '';
  public once: boolean = false;

  public constructor(options?: HandlerOptions) {
    super();
    if (options !== undefined && options !== null) {
      this.name = options.name ? options.name : '';
      this.once =
        options.once !== undefined && options.once !== null
          ? options.once
          : false;
    }
  }

  public async execute?(...values: unknown[]): Promise<unknown>;
}
