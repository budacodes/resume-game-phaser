import { DialogPort } from "../ports/DialogPort";
import { InventoryRepository } from "../ports/InventoryRepository";

export interface CollectItemMessages {
  alreadyHaveText: string;
  obtainedText: string;
  hint?: string;
  mode?: "read" | "question";
}

export class CollectItemUseCase {
  constructor(
    private readonly inventory: InventoryRepository,
    private readonly dialog: DialogPort,
  ) {}

  execute(itemId: string, messages: CollectItemMessages): void {
    if (this.inventory.hasItem(itemId)) {
      this.dialog.show({
        text: messages.alreadyHaveText,
        hint: messages.hint,
        mode: messages.mode ?? "read",
      });
      return;
    }

    this.inventory.obtainItem(itemId);
    this.dialog.show({
      text: messages.obtainedText,
      hint: messages.hint,
      mode: messages.mode ?? "read",
    });
  }
}
