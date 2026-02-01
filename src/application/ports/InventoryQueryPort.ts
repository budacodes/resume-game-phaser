import { InventoryItem } from "../../config/models/InventoryItem";

export interface InventoryQueryPort {
  getObtainedItems(): InventoryItem[];
}
