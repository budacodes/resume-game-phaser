import { InteractionContextManager } from "../../managers/InteractionContextManager";
import { DialogPort } from "../ports/DialogPort";
import { InventoryRepository } from "../ports/InventoryRepository";

export class FountainInteractionUseCase {
  constructor(
    private readonly inventory: InventoryRepository,
    private readonly dialog: DialogPort,
  ) {}

  startInteraction(): void {
    const contextManager =
      InteractionContextManager.getInstance();

    if (this.inventory.hasItem("coin")) {
      contextManager.setContext({ type: "fountain" });

      this.dialog.show({
        text: "A fonte emite uma aura estranha...\nTalvez uma MOEDA possa ser USADA aqui...",
        hint: "[ ESPAÇO para fechar ]",
        mode: "read",
      });

      return;
    }

    contextManager.clear();

    this.dialog.show({
      text: "A fonte emite uma aura estranha...\nParece até pedir algo...",
      hint: "[ ESPAÇO para fechar ]",
      mode: "read",
    });
  }
}
