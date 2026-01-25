import Phaser from "phaser";

export class BudaDog extends Phaser.GameObjects.Sprite {
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
    this.play("buda-dog-petting");
  }

  private createAnimation(): void {
    // Verifica se animação já existe
    if (this.scene.anims.exists("buda-dog-petting")) {
      return;
    }

    this.scene.anims.create({
      key: "buda-dog-petting",
      frames: this.scene.anims.generateFrameNumbers(
        "buda_dog",
        {
          start: 1,
          end: 27, 
        }
      ),
      frameRate: 8,
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
