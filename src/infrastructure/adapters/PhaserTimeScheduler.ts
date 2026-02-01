import Phaser from "phaser";

export class PhaserTimeScheduler {
  constructor(private readonly scene: Phaser.Scene) {}

  delay(ms: number, callback: () => void): void {
    this.scene.time.delayedCall(ms, callback);
  }
}
