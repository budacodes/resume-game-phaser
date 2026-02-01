import Phaser from "phaser";

export class PhaserInteractionInput {
  private keyE?: Phaser.Input.Keyboard.Key;
  private keyY?: Phaser.Input.Keyboard.Key;
  private keyN?: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    if (!scene.input.keyboard) return;

    this.keyE = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E,
    );
    this.keyY = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.Y,
    );
    this.keyN = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.N,
    );
  }

  isInteractPressed(): boolean {
    return Boolean(
      this.keyE &&
        Phaser.Input.Keyboard.JustDown(this.keyE),
    );
  }

  isYesPressed(): boolean {
    return Boolean(
      this.keyY &&
        Phaser.Input.Keyboard.JustDown(this.keyY),
    );
  }

  isNoPressed(): boolean {
    return Boolean(
      this.keyN &&
        Phaser.Input.Keyboard.JustDown(this.keyN),
    );
  }
}
