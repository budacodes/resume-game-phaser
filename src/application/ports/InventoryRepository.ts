export interface InventoryRepository {
  hasItem(itemId: string): boolean;
  obtainItem(itemId: string): void;
  removeItem(itemId: string): void;
}
