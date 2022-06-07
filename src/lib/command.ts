export class Command {
  public data: unknown;
  public executer: (interaction: any) => Promise<any>;

  public constructor(
    inputData: unknown,
    inputExecuter: (interaction: any) => Promise<any>
  ) {
    this.data = inputData;
    this.executer = inputExecuter;
  }
}
