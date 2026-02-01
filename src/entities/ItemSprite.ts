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
    super(scene, x, y, item.iconTexture, item.iconFrame);

    scene.add.existing(this);

    if (item.animation) {
      this.createAnimation(item.animation);
      this.play(item.animation.animationKey);
    }
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
