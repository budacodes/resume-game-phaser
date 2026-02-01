import Phaser from "phaser";

interface DialogEventHandlers {
  onStarted: () => void;
  onFinished: () => void;
}

export class PhaserDialogEventAdapter {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly handlers: DialogEventHandlers,
  ) {}

  subscribe(): void {
    this.scene.game.events.on(
      "dialog-started",
      this.handlers.onStarted,
    );
    this.scene.game.events.on(
      "dialog-finished",
      this.handlers.onFinished,
    );
  }
}
