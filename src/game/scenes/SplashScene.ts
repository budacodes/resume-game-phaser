import { Scene } from "phaser";
import { CursorManager } from "../../managers/CursorManager";
import { CodeRainBackground } from "./intro/components/CodeRainBackground";
import { COLORS } from "./ui/Utils";

export class SplashScene extends Scene {
  private cursorManager!: CursorManager;
  private codeRainBackground!: CodeRainBackground;

  constructor() {
    super("SplashScene");
  }

  create() {
    this.cursorManager = CursorManager.getInstance();
    this.cursorManager.setState("default");
    this.game.events.emit("scene-changed", "SplashScene");
    this.game.events.emit("disable-joystick");

    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    // TÍTULO
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 100,
        "DEBUG MY CAREER",
        {
          fontFamily: '"VT323"',
          fontSize: "48px",
          color: "#ffffff",
          align: "center",
        },
      )
      .setOrigin(0.5);

    // SUBTÍTULO
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 40,
        "by Buda | Front-End Engineer",
        {
          fontFamily: '"VT323"',
          fontSize: "24px",
          color: `#${COLORS.blue}`,
          align: "center",
        },
      )
      .setOrigin(0.5);

    this.codeRainBackground = new CodeRainBackground(this);
    this.codeRainBackground.create();

    this.createMenuButtons();
  }

  private createMenuButtons() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const startY = height / 2 + 50;

    // Verifica se existe progresso salvo (ajuste as chaves conforme seu projeto)
    const hasSave =
      (localStorage.getItem("player_name") &&
        localStorage.getItem("player_gender") &&
        localStorage.getItem("player_career")) ||
      localStorage.getItem("game_quests_progress");

    // BOTÃO: NOVO JOGO
    this.createButton(
      centerX,
      startY,
      "NOVO JOGO",
      true,
      () => {
        this.startNewGame();
      },
    );

    this.createButton(
      centerX,
      startY + 70,
      "CONTINUAR",
      !!hasSave,
      () => {
        if (hasSave) {
          this.scene.start("MainScene");
        } else {
          return null;
        }
      },
    );
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    enabled: boolean,
    callback: () => void,
  ) {
    const text = this.add
      .text(x, y, label, {
        fontFamily: '"VT323"',
        fontSize: "32px",
        color: enabled ? "#ffffff" : "#888888",
        backgroundColor: enabled ? "#000000" : "#333333",
        padding: { x: 20, y: 15 },
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false });

    if (enabled) {
      this.tweens.add({
        targets: text,
        alpha: { from: 0.6, to: 1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });

      text.on("pointerdown", () => {
        this.tweens.add({
          targets: text,
          alpha: 0,
          scale: 1.2,
          duration: 200,
          onComplete: callback,
        });
      });
    }

    text.on("pointerover", () => {
      this.cursorManager.setState("hover");

      if (enabled) {
        text.setTint(+`0x${COLORS.gold}`); // Feedback visual ao passar o mouse
      }
    });

    text.on("pointerout", () => {
      this.cursorManager.setState("default");

      if (enabled) {
        text.clearTint();
      }
    });
  }

  private startNewGame() {
    // Limpa dados de persistência (Nome, Gênero, Quests, etc)
    // Se você usa o SettingsManager para volumes, cuidado para não apagar 'settings'
    const keysToClear = [
      "player_name",
      "player_gender",
      "game_quests_progress",
      "current_career",
    ];
    keysToClear.forEach((key) =>
      localStorage.removeItem(key),
    );

    // Opcional: Se quiser resetar TUDO exceto volume:
    // Object.keys(localStorage).forEach(key => {
    //   if(key !== 'game_settings') localStorage.removeItem(key);
    // });

    this.scene.start("IntroScene");
  }

  update() {}
}
