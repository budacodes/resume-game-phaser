import { Scene } from "phaser";
import { INTRO_CONFIG } from "../config/IntroConfig";

export class DialogBox {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private textContent: Phaser.GameObjects.Text;
  size: { width: number; height: number };

  constructor(
    scene: Scene,
    size: { width: number; height: number }
  ) {
    this.size = size;
    this.scene = scene;
    this.container = this.scene.add
      .container(0, 0)
      .setDepth(100);
    this.textContent = this.scene.add.text(0, 0, "", {
      ...INTRO_CONFIG.fonts.dialog,
      color: "#ffffff",
      wordWrap: { width: this.size.width - 50},
      lineSpacing: 12,
    });

    this.createBox();
  }

  private createBox(): void {
    const x = this.scene.scale.width / 2;
    const y = this.scene.scale.height - this.size.height / 2 - 15;

    this.container.setPosition(x, y);

    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.6);
    shadow.fillRoundedRect(
      -this.size.width / 2 + 4,
      -this.size.height / 2 + 4,
      this.size.width,
      this.size.height,
      12
    );

    const bg = this.scene.add.graphics();
    bg.fillStyle(INTRO_CONFIG.colors.textBox, 0.9);
    bg.fillRoundedRect(
      -this.size.width / 2,
      -this.size.height / 2,
      this.size.width,
      this.size.height,
      12
    );
    bg.lineStyle(3, INTRO_CONFIG.colors.highlight, 0.9);
    bg.strokeRoundedRect(
      -this.size.width / 2,
      -this.size.height / 2,
      this.size.width,
      this.size.height,
      12
    );

    this.textContent.setPosition(
      -this.size.width / 2 + 25,
      -this.size.height / 2 + 40
    );

    this.container.add([shadow, bg, this.textContent]);
    this.container.setVisible(false);
  }

  show(): void {
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  setText(text: string): void {
    this.textContent.setText(text);
  }

  clearText(): void {
    this.textContent.setText("");
  }

  get isVisible(): boolean {
    return this.container.visible;
  }
}
