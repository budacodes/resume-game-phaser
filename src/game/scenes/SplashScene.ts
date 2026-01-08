import { Scene } from "phaser";

export class SplashScene extends Scene {
  private clickToStartText!: Phaser.GameObjects.Text;

  constructor() {
    super("SplashScene");
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    const title = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 100,
        "PORTFÓLIO INTERATIVO",
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
        "CLIQUE NA TELA PARA INICIAR",
        {
          fontFamily: '"VT323"',
          fontSize: "32px",
          color: "#ffffff",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: { x: 20, y: 15 },
          align: "center",
        }
      )
      .setOrigin(0.5);

    this.tweens.add({
      targets: this.clickToStartText,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.createCodeGrid();
    this.setupClickHandler();
  }

  private createCodeGrid() {
    const codeChars = "01{}();:.=+-*/&|!?";
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      const char =
        codeChars[
          Math.floor(Math.random() * codeChars.length)
        ];

      this.add.text(x, y, char, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#4cc9f0",
      });
    }
  }

  private setupClickHandler() {
    const bg = this.add
      .rectangle(
        0,
        0,
        this.scale.width,
        this.scale.height,
        0x000000,
        0
      )
      .setOrigin(0, 0)
      .setInteractive();

    bg.on("pointerdown", () => {
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

    this.input.keyboard?.once("keydown", () => {
      this.scene.start("IntroScene");
    });
  }

  update() {}
}
