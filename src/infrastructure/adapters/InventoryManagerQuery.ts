import { InventoryQueryPort } from "../../application/ports/InventoryQueryPort";
import { InventoryManager } from "../../managers/InventoryManager";
import { InventoryItem } from "../../config/models/InventoryItem";

export class InventoryManagerQuery implements InventoryQueryPort {
  constructor(private readonly manager: InventoryManager) {}

  getObtainedItems(): InventoryItem[] {
    return this.manager.getObtainedItems();
  }
}
