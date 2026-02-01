import { InventoryRepository } from "../../application/ports/InventoryRepository";
import { InventoryManager } from "../../managers/InventoryManager";

export class InventoryManagerRepository
  implements InventoryRepository
{
  constructor(private readonly manager: InventoryManager) {}

  hasItem(itemId: string): boolean {
    return this.manager.hasItem(itemId);
  }

  obtainItem(itemId: string): void {
    this.manager.obtainItem(itemId);
  }

  removeItem(itemId: string): void {
    this.manager.removeItem(itemId);
  }
}
