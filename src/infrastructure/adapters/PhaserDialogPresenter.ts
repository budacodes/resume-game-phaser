import Phaser from "phaser";
import { DialogData, DialogPort } from "../../application/ports/DialogPort";

export class PhaserDialogPresenter implements DialogPort {
  constructor(private readonly scene: Phaser.Scene) {}

  show(dialog: DialogData): void {
    this.scene.game.events.emit("dialog-started", dialog);
  }

  hide(): void {
    this.scene.game.events.emit("hide-dialog");
  }
}
