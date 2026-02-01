import { DialogPort } from "../ports/DialogPort";
import { InventoryRepository } from "../ports/InventoryRepository";

export class FountainInteractionUseCase {
  constructor(
    private readonly inventory: InventoryRepository,
    private readonly dialog: DialogPort,
  ) {}

  startInteraction(): boolean {
    if (this.inventory.hasItem("coin")) {
      this.dialog.show({
        text: "A fonte emite uma aura estranha...\nDeseja jogar uma moeda?\n\n[Y] Sim [N] Não",
        mode: "question",
      });
      return true;
    }

    this.dialog.show({
      text: "A fonte emite uma aura estranha...\nParece até pedir algo...",
      hint: "[ ESPAÇO para fechar ]",
      mode: "read",
    });
    return false;
  }

  answerYes(): void {
    this.inventory.removeItem("coin");
    this.dialog.show({
      hint: "[ ESPAÇO para fechar ]",
      text: "Você fez um pedido silencioso...",
    });
  }

  answerNo(): void {
    this.dialog.hide();
  }
}
