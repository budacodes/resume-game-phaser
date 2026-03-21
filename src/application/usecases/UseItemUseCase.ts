import { InteractionContextManager } from "../../managers/InteractionContextManager";
import { AudioPort } from "../ports/AudioPort";
import { DialogPort } from "../ports/DialogPort";
import { InventoryRepository } from "../ports/InventoryRepository";

export class UseItemUseCase {
  constructor(
    private readonly inventory: InventoryRepository,
    private readonly dialog: DialogPort,
    private readonly audio: AudioPort,
  ) {}

  execute(itemId: string): void {
    const context =
      InteractionContextManager.getInstance().getContext();

    if (!this.inventory.hasItem(itemId)) return;

    if (itemId === "coin" && context.type === "fountain") {
      this.inventory.removeItem("coin");

      this.audio.playSFX("snd_coin");
      setTimeout(() => {
        this.audio.playSFX("snd_water_drop");
      }, 400);

      this.dialog.show({
        text: "Lorem ipsum sit dolor amet.",
      });

      return;
    }

    this.dialog.show({
      text: "Não parece ter utilidade aqui...",
      hint: "[ ESPAÇO para fechar ]",
    });
  }
}
