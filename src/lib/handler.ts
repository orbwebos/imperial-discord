export class Handler {
  public name: string;
  public once: boolean;

  public constructor(name: string, once: boolean) {
    this.name = name;
    this.once = once;
  }
}
