import Phaser from "phaser";

export class FallbackFrameFactory {
  constructor(private readonly scene: Phaser.Scene) {}

  ensureFrameGoldExists(): void {
    if (this.scene.textures.exists("frame-gold")) return;

    const graphics = this.scene.add.graphics();

    const width = 128;
    const height = 128;

    graphics.fillGradientStyle(
      0xffd700,
      1,
      0xd4af37,
      1,
      0xb8860b,
      1,
      0x8b6514,
      1,
    );
    graphics.fillRect(0, 0, width, height);

    graphics.lineStyle(4, 0x000000, 0.8);
    graphics.strokeRect(2, 2, width - 4, height - 4);

    graphics.lineStyle(3, 0xffd700, 1);
    graphics.strokeRect(0, 0, width, height);

    graphics.generateTexture("frame-gold", width, height);
    graphics.destroy();
  }
}
