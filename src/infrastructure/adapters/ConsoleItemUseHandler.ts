import { ItemUsePort } from "../../application/ports/ItemUsePort";

export class ConsoleItemUseHandler implements ItemUsePort {
  use(itemId: string): void {
    console.log("Usar item:", itemId);
  }
}
