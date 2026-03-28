import Phaser from "phaser";
import { InventoryItem } from "../config/models/InventoryItem";

export class InventoryItemSprite
  extends Phaser.GameObjects.Sprite
{
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    item: InventoryItem,
  ) {
    const texture =
      item.id === "keycard"
        ? InventoryItemSprite.createKeycardTexture(scene)
        : item.iconTexture;

    const frame =
      item.id === "keycard" ? undefined : item.iconFrame;

    super(scene, x, y, texture, frame);

    scene.add.existing(this);

    // animação só para itens normais
    if (item.id !== "keycard" && item.animation) {
      this.createAnimation(item.animation);
      this.play(item.animation.animationKey);
    }
  }

  private static createKeycardTexture(
    scene: Phaser.Scene,
  ): string {
    const key = "keycard-icon";

    if (scene.textures.exists(key)) return key;

    const g = scene.add.graphics();

    // fundo do cartão
    g.fillStyle(0x1a1a2e, 1);
    g.fillRoundedRect(0, 0, 24, 16, 2);

    // faixa superior
    g.fillStyle(0x00ffcc, 1);
    g.fillRect(0, 0, 24, 5);

    // "chip"
    g.fillStyle(0xffd700, 1);
    g.fillRect(22, 10, 6, 4);

    // linha decorativa
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(4, 10, 12, 2);

    g.generateTexture(key, 24, 16);
    g.destroy();

    return key;
  }

  private createAnimation(
    anim: InventoryItem["animation"],
  ) {
    if (!anim || this.scene.anims.exists(anim.animationKey))
      return;

    this.scene.anims.create({
      key: anim.animationKey,
      frames: this.scene.anims.generateFrameNumbers(
        anim.texture,
        {
          start: anim.startFrame,
          end: anim.endFrame,
        },
      ),
      frameRate: anim.frameRate,
      repeat: anim.repeat ?? -1,
    });
  }

  show(x: number, y: number, scale = 1, alpha = 1): void {
    this.setPosition(x, y);
    this.setScale(scale);
    this.setAlpha(alpha);
    this.setVisible(true);
  }

  hide(delay = 0): void {
    if (delay > 0) {
      this.scene.time.delayedCall(delay, () =>
        this.destroy(),
      );
    } else {
      this.destroy();
    }
  }
}
