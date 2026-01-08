import { Scene } from "phaser";

export class InputSystem {
  private scene: Scene;
  private continueKey!: Phaser.Input.Keyboard.Key;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  setup(): void {
    if (this.scene.input.keyboard) {
      this.continueKey = this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
      );
      this.scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
    }
  }

  onContinue(callback: () => void): void {
    this.continueKey?.removeAllListeners();
    this.continueKey?.on("down", callback);
    this.scene.input.on("pointerdown", callback);
  }

  removeAllListeners(): void {
    this.continueKey?.removeAllListeners();
    this.scene.input.keyboard?.removeAllListeners();
    this.scene.input.off("pointerdown");
  }
}
