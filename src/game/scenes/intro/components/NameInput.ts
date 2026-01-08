import { Scene } from "phaser";
import { INTRO_CONFIG } from "../config/IntroConfig";

export class NameInput {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private inputText: Phaser.GameObjects.Text;
  private cursor: Phaser.GameObjects.Text;
  private errorMsg: Phaser.GameObjects.Text;
  private cursorTween: Phaser.Tweens.Tween;
  private onComplete: (name: string) => void;

  constructor(
    scene: Scene,
    onComplete: (name: string) => void
  ) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.container = this.scene.add.container(
      this.scene.scale.width / 2,
      320
    );
  }

  create(): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-200, -35, 400, 70, 15);
    bg.lineStyle(3, INTRO_CONFIG.colors.highlight, 0.8);
    bg.strokeRoundedRect(-200, -35, 400, 70, 15);

    this.inputText = this.scene.add.text(
      -190,
      -20,
      "DIGITE SEU NOME",
      {
        ...INTRO_CONFIG.fonts.input,
        color: "#888888",
      }
    );

    this.cursor = this.scene.add
      .text(-190, -20, "█", {
        ...INTRO_CONFIG.fonts.input,
        color: this.convertColorToString(
          INTRO_CONFIG.colors.highlight
        ),
      })
      .setVisible(false);

    const instruction = this.scene.add
      .text(
        0,
        60,
        "(Mínimo 2 letras • Enter para confirmar)",
        {
          ...INTRO_CONFIG.fonts.small,
          color: "#aaaaaa",
        }
      )
      .setOrigin(0.5);

    this.errorMsg = this.scene.add
      .text(0, 100, "Digite pelo menos 2 caracteres!", {
        ...INTRO_CONFIG.fonts.small,
        color: this.convertColorToString(
          INTRO_CONFIG.colors.error
        ),
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.container.add([
      bg,
      this.inputText,
      this.cursor,
      instruction,
      this.errorMsg,
    ]);

    this.setupCursorAnimation();
    this.setupInputHandling();
  }

  private setupCursorAnimation(): void {
    this.cursorTween = this.scene.tweens.add({
      targets: this.cursor,
      alpha: { from: 0, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  private setupInputHandling(): void {
    let name = "";

    const updateDisplay = () => {
      if (name.length === 0) {
        this.inputText
          .setText("DIGITE SEU NOME")
          .setColor("#888888");
        this.cursor.setVisible(false);
        this.cursorTween.pause();
      } else {
        this.inputText
          .setText(name.toUpperCase())
          .setColor("#ffffff");
        this.cursor.x = -190 + this.inputText.width + 2;
        this.cursor.setVisible(true);
        this.cursorTween.resume();
        this.errorMsg.setVisible(false);
      }
    };

    const handleInputKey = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        if (name.length < 2) {
          this.showError();
          return;
        }

        this.scene.input.keyboard?.off(
          "keydown",
          handleInputKey
        );
        this.onComplete(name.toUpperCase());
      } else if (event.key === "Backspace") {
        name = name.slice(0, -1);
        updateDisplay();
      } else if (
        event.key.length === 1 &&
        name.length < 15
      ) {
        if (/^[a-zA-ZÀ-ÿ\s'-]$/.test(event.key)) {
          name += event.key;
          updateDisplay();
        }
      }
    };

    this.scene.input.keyboard?.on(
      "keydown",
      handleInputKey
    );
    updateDisplay();
  }

  private showError(): void {
    this.errorMsg.setVisible(true);

    this.scene.tweens.add({
      targets: this.container,
      x: {
        from: this.container.x - 5,
        to: this.container.x + 5,
      },
      duration: 50,
      yoyo: true,
      repeat: 5,
      onComplete: () =>
        this.container.setX(this.scene.scale.width / 2),
    });
  }

  destroy(): void {
    this.cursorTween.stop();
    this.container.destroy();
    this.scene.input.keyboard?.removeAllListeners(
      "keydown"
    );
  }

  private convertColorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }
}
