import Phaser from "phaser";

export class Planet extends Phaser.GameObjects.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string
  ) {
    super(scene, x, y, texture);

    // Adiciona ao gerenciador de display
    scene.add.existing(this);

    // Cria a animação se não existir
    this.createAnimation();

    // Inicia a animação
    this.play("planet-rotate");
  }

  private createAnimation(): void {
    // Verifica se animação já existe
    if (this.scene.anims.exists("planet-rotate")) {
      return;
    }

    // Cria animação com os 14 frames (128x128 cada)
    this.scene.anims.create({
      key: "planet-rotate",
      frames: this.scene.anims.generateFrameNumbers(
        "planet",
        {
          start: 0,
          end: 13, // 14 frames: 0 a 13
        }
      ),
      frameRate: 8, // 10 FPS - ajuste conforme necessidade
      repeat: -1, // Loop infinito
      yoyo: false,
    });
  }

  show(startScale, endScale, x, y, startAlpha): void {
    this.setScale(startScale);
    this.setX(x);
    this.setY(y);
    this.setAlpha(startAlpha);

    this.scene.tweens.add({
      targets: this,
      scale: endScale,
      ease: "Power2",
      duration: 2000,
    });
  }

  hide(endAlpha): void {
    this.scene.tweens.add({
      targets: this,
      alpha: endAlpha,
      ease: "Power2",
      duration: 1000,
    });

    this.scene.time.delayedCall(1000, () => {
      this.destroy();
    });
  }
}
