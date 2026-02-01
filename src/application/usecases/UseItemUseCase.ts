import { ItemUsePort } from "../ports/ItemUsePort";

export class UseItemUseCase {
  constructor(private readonly itemUsePort: ItemUsePort) {}

  execute(itemId: string): void {
    this.itemUsePort.use(itemId);
  }
}
