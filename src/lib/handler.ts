import { Component } from './component';

export interface HandlerOptions {
  componentOptions?: Component.Options;
  name?: string;
  once?: boolean;
}

export class Handler extends Component {
  public name: string = '';
  public once: boolean = false;

  public constructor(options?: HandlerOptions) {
    super(options?.componentOptions);

    this.name = options?.name ?? this.name;
    this.once = options?.once ?? this.once;
  }

  public async execute?(...values: unknown[]): Promise<unknown>;
}
