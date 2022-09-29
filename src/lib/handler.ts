import { Base } from './base';

export interface HandlerOptions {
  baseOptions?: Base.ClientOrOptions;
  name?: string;
  once?: boolean;
}

export class Handler extends Base {
  public name: string = '';
  public once: boolean = false;

  public constructor(options?: HandlerOptions) {
    super(options?.baseOptions);

    this.name = options?.name ?? this.name;
    this.once = options?.once ?? this.once;
  }

  public async execute?(...values: unknown[]): Promise<unknown>;
}
