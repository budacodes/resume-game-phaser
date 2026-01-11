import { Scene } from "phaser";
import { CursorManager } from "../../systems/CursorManager";
import { CodeRainBackground } from "./intro/components/CodeRainBackground";

export class SplashScene extends Scene {
  private clickToStartText!: Phaser.GameObjects.Text;
  private cursorManager!: CursorManager;
  private codeRainBackground!: CodeRainBackground;

  constructor() {
    super("SplashScene");
  }

  create() {
    this.cursorManager = CursorManager.getInstance();


    this.cursorManager.setState("default");

    this.game.events.emit("scene-changed", "SplashScene");

    // Ou desativa o joystick diretamente
    this.game.events.emit("disable-joystick");

    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    const title = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 100,
        "DEBUG MY CAREER",
        {
          fontFamily: '"VT323"',
          fontSize: "48px",
          color: "#ffffff",
          align: "center",
        }
      )
      .setOrigin(0.5);

    const subtitle = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 40,
        "by Buda | Front-End Engineer",
        {
          fontFamily: '"VT323"',
          fontSize: "24px",
          color: "#4cc9f0",
          align: "center",
        }
      )
      .setOrigin(0.5);

    this.clickToStartText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 + 50,
        "CLIQUE AQUI PARA INICIAR",
        {
          fontFamily: '"VT323"',
          fontSize: "32px",
          color: "#ffffff",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: { x: 20, y: 15 },
          align: "center",
        }
      )
      .setOrigin(0.5)
      .on("pointerover", () => {
        this.cursorManager.setState("hover");
      })
      .on("pointerout", () => {
        this.cursorManager.setState("default");
      });

    this.tweens.add({
      targets: this.clickToStartText,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.codeRainBackground = new CodeRainBackground(this);
    this.codeRainBackground.create();
    this.setupClickHandler();
  }

  private setupClickHandler() {
    const button = this.add
      .rectangle(
        this.clickToStartText.x -
          this.clickToStartText.width / 2,
        this.clickToStartText.y -
          this.clickToStartText.height / 2,
        this.clickToStartText.width + 20,
        this.clickToStartText.height + 15,
        0x000000,
        0
      )
      .setOrigin(0, 0)
      .setInteractive();

    button.on("pointerover", () => {
      this.cursorManager.setState("hover");
    });

    button.on("pointerout", () => {
      this.cursorManager.setState("default");
    });

    button.on("pointerdown", () => {
      try {
        const clickSound = this.sound.add("click_sound", {
          volume: 0.3,
        });
        clickSound.play();
      } catch (error) {}

      this.tweens.add({
        targets: [this.clickToStartText],
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          this.scene.start("IntroScene");
        },
      });
    });

    // this.input.keyboard?.once("keydown", () => {
    //   this.scene.start("IntroScene");
    // });
  }

  update() {}
}
