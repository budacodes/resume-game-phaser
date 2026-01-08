import { Scene } from "phaser";
import { INTRO_CONFIG } from "../config/IntroConfig";

export class DialogBox {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private textContent: Phaser.GameObjects.Text;

  constructor(scene: Scene) {
    this.scene = scene;
    this.container = this.scene.add
      .container(0, 0)
      .setDepth(100);
    this.textContent = this.scene.add.text(0, 0, "", {
      ...INTRO_CONFIG.fonts.dialog,
      color: "#ffffff",
      wordWrap: { width: 550 },
      lineSpacing: 12,
    });

    this.createBox();
  }

  private createBox(): void {
    const width = 600;
    const height = 150;
    const x = this.scene.scale.width / 2;
    const y = this.scene.scale.height - height / 2 - 15;

    this.container.setPosition(x, y);

    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.6);
    shadow.fillRoundedRect(
      -width / 2 + 4,
      -height / 2 + 4,
      width,
      height,
      12
    );

    const bg = this.scene.add.graphics();
    bg.fillStyle(INTRO_CONFIG.colors.textBox, 0.9);
    bg.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      12
    );
    bg.lineStyle(3, INTRO_CONFIG.colors.highlight, 0.9);
    bg.strokeRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      12
    );

    this.textContent.setPosition(
      -width / 2 + 25,
      -height / 2 + 40
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
