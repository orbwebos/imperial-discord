import { Component } from './component';

export interface HandlerOptions {
  name?: string;
  once?: boolean;
}

export class Handler extends Component {
  public name: string;
  public once: boolean = false;

  public constructor(options?: HandlerOptions) {
    super();

    this.name = options?.name ?? this.deriveEventName();
    this.once = options?.once ?? this.once;
  }

  public async execute?(...values: unknown[]): Promise<unknown>;

  private deriveEventName(): string {
    const noSuffix = this.constructor.name.replace(/([A-Z])[a-z]*$/, '');

    return noSuffix.charAt(0).toLowerCase() + noSuffix.substring(1);
  }
}
