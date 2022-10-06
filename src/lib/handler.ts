import { Component } from './component';

export interface HandlerOptions {
  event?: string;
  once?: boolean;
}

export class Handler extends Component {
  public event: string;
  public once: boolean = false;

  public constructor(options?: HandlerOptions) {
    super();

    this.event = options?.event ?? this.deriveEventName();
    this.once = options?.once ?? this.once;
  }

  public async execute?(...values: unknown[]): Promise<unknown>;

  private deriveEventName(): string {
    const noSuffix = this.constructor.name.replace(/([A-Z])[a-z]*$/, '');

    return noSuffix.charAt(0).toLowerCase() + noSuffix.substring(1);
  }
}
