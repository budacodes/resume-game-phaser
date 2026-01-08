import { Scene } from "phaser";
import { INTRO_CONFIG } from "../config/IntroConfig";

export class Background {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  create(): void {
    this.createBackground();
    this.createCodeGrid();
  }

  private createBackground(): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(INTRO_CONFIG.colors.background, 1);
    bg.fillRect(
      0,
      0,
      this.scene.scale.width,
      this.scene.scale.height
    );
  }

  private createCodeGrid(): void {
    const codeChars = "01{}();:.=+-*/&|!?";

    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(
        0,
        this.scene.scale.width
      );
      const y = Phaser.Math.Between(
        0,
        this.scene.scale.height
      );
      const char =
        codeChars[
          Math.floor(Math.random() * codeChars.length)
        ];

      this.scene.add.text(x, y, char, {
        fontFamily: "VT323",
        fontSize: "14px",
        color: this.convertColorToString(
          INTRO_CONFIG.colors.budaGlow
        ),
      });
    }
  }

  private convertColorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }
}
