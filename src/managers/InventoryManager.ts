import { ITEM_CATALOG } from "../config/data/ItemCatalog";
import { InventoryItem } from "../config/models/InventoryItem";

export class InventoryManager {
  private static instance: InventoryManager;
  private items: Map<string, InventoryItem>;

  private constructor() {
    this.items = new Map();

    // Clona catálogo inicial
    Object.values(ITEM_CATALOG).forEach((item) => {
      this.items.set(item.id, { ...item });
    });
  }

  static getInstance(): InventoryManager {
    if (!InventoryManager.instance) {
      InventoryManager.instance = new InventoryManager();
    }
    return InventoryManager.instance;
  }

  getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  getObtainedItems(): InventoryItem[] {
    return this.getAllItems().filter(
      (item) => item.obtained,
    );
  }

  obtainItem(itemId: string): void {
    const item = this.items.get(itemId);
    if (item) {
      item.obtained = true;
    }
  }

  hasItem(itemId: string): boolean {
    return this.items.get(itemId)?.obtained ?? false;
  }

  removeItem(itemId: string): void {
    const item = this.items.get(itemId);

    if (!item) return;

    item.obtained = false;
  }

  reset(): void {
    this.items.forEach((item) => (item.obtained = false));
  }
}
