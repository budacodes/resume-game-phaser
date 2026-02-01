import Phaser from "phaser";
import { COLORS } from "../Utils";

export class QuestToast {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = this.scene.add.container(
      this.scene.scale.width / 2,
      -100,
    );
    this.container.setScrollFactor(0);
    this.container.setDepth(1000); // Sempre acima de tudo
  }

  public show(title: string): void {
    // 1. Criar o fundo do toast
    const bg = this.scene.add.rectangle(
      0,
      0,
      300,
      60,
      0x0b0b0b,
      0.9,
    );
    bg.setStrokeStyle(2, +`0x${COLORS.green}`);

    // 2. Ícone de check
    const icon = this.scene.add
      .sprite(-130, 0, "check_icon")
      .setOrigin(0, 0.5);

    // 3. Texto da missão
    const label = this.scene.add
      .text(-90, -10, "MISSÃO CONCLUÍDA!", {
        fontFamily: "'VT323'",
        fontSize: "16px",
        color: `#${COLORS.green}`,
      })
      .setOrigin(0, 0.5);

    const questTitle = this.scene.add
      .text(-90, 10, title.toUpperCase(), {
        fontFamily: "'VT323'",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0, 0.5);

    this.container.add([bg, icon, label, questTitle]);

    // 4. Animação de Entrada e Saída (Tween)
    this.scene.tweens.add({
      targets: this.container,
      y: 60, // Desce até aqui
      duration: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        // Espera 3 segundos e sobe de volta
        this.scene.time.delayedCall(5000, () => {
          this.scene.tweens.add({
            targets: this.container,
            y: -100,
            duration: 500,
            ease: "Power2.easeIn",
            onComplete: () => {
              this.container.removeAll(true);
            },
          });
        });
      },
    });
  }
}
