import { InventoryRepository } from "../ports/InventoryRepository";

export class DropItemUseCase {
  constructor(private readonly inventory: InventoryRepository) {}

  execute(itemId: string): void {
    this.inventory.removeItem(itemId);
  }
}
