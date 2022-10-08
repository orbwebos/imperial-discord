import { Component } from './component';

export interface HandlerOptions {
  event?: string;
  once?: boolean;
}

export class Handler extends Component {
  public event: string;
  public once: boolean;

  public constructor(options?: HandlerOptions) {
    super();

    this.event = options?.event ?? this.deriveEventName();
    this.once = options?.once ?? false;
  }

  public async run?(...values: unknown[]): Promise<unknown>;

  public syncHook() {
    if (this.once) {
      this.client.once(this.event, (...args) => {
        this.run(...args, this.client).catch((error) =>
          this.logger.error(error)
        );
      });
    } else {
      this.client.on(this.event, (...args) => {
        this.run(...args, this.client).catch((error) =>
          this.logger.error(error)
        );
      });
    }

    return super.syncHook();
  }

  private deriveEventName(): string {
    const noSuffix = this.constructor.name.replace(/([A-Z])[a-z]*$/, '');

    return noSuffix.charAt(0).toLowerCase() + noSuffix.substring(1);
  }
}
