import Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { CursorPort } from "../../../../application/ports/CursorPort";
import { SURVIVAL_GUIDE_PAGES } from "../../../../config/data/SurvivalGuide";
import { CursorManagerAdapter } from "../../../../infrastructure/adapters/CursorManagerAdapter";
import { CursorManager } from "../../../../managers/CursorManager";

export class SurvivalGuideModal {
  private titleText!: Phaser.GameObjects.Text;
  private contentText!: BBCodeText;
  private hintText!: Phaser.GameObjects.Text;
  private prevButton!: Phaser.GameObjects.Text;
  private nextButton!: Phaser.GameObjects.Text;
  private scribbleText!: Phaser.GameObjects.Text;

  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private currentPageIndex = 0;

  private cursorManager!: CursorPort;

  constructor(scene: Phaser.Scene, cursor?: CursorPort) {
    this.scene = scene;

    this.cursorManager =
      cursor ??
      new CursorManagerAdapter(CursorManager.getInstance());

    this.create();
  }

  private create() {
    const { width, height } = this.scene.scale;

    const overlay = this.scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setInteractive();

    // 📄 FUNDO DA PÁGINA (com textura fake)
    const paper = this.scene.add.graphics();

    paper.fillStyle(0xf5f5dc, 1);
    paper.fillRoundedRect(
      width / 2 - 200,
      height / 2 - 250,
      400,
      500,
      6,
    );

    // linhas sutis (tipo caderno)
    paper.lineStyle(1, 0x000000, 0.05);
    for (
      let y = height / 2 - 192;
      y < height / 2 + 208;
      y += 24
    ) {
      paper.lineBetween(
        width / 2 - 176,
        y,
        width / 2 + 176,
        y,
      );
    }

    // leve borda imperfeita
    paper.lineStyle(2, 0x000000, 0.2);
    paper.strokeRoundedRect(
      width / 2 - 200,
      height / 2 - 250,
      400,
      500,
      8,
    );

    // paper.setRotation(Phaser.Math.FloatBetween(-0.01, 0.01));

    this.titleText = this.scene.add
      .text(width / 2, height / 2 - 200, "", {
        fontSize: "24px",
        color: "#000",
        fontStyle: "bold",
        fontFamily: "Calligraffitti, cursive",
      })
      .setOrigin(0.5);

    this.contentText = new BBCodeText(
      this.scene,
      width / 2,
      height / 2 - 142,
      "",
      {
        fontSize: "16px",
        color: "#000",
        wordWrap: { width: 340 },
        fontFamily: "Calligraffitti, cursive",
      },
    ).setOrigin(0.5, 0);

    // ✍️ RABISCO (anotação)
    this.scribbleText = this.scene.add
      .text(width / 2 - 80, height / 2 + 80, "", {
        fontSize: "20px",
        color: "#ff2222",
        fontStyle: "bold",
        fontFamily: "Calligraffitti, cursive",
        wordWrap: { width: 200 },
      })
      .setOrigin(0.5)
      .setRotation(-0.1)
      .setAlpha(0.7);

    // BOTÕES
    this.prevButton = this.scene.add
      .text(width / 2 - 180, height / 2 + 210, "←", {
        fontSize: "30px",
        color: "#000",
      })
      .setInteractive();

    this.nextButton = this.scene.add
      .text(width / 2 + 160, height / 2 + 210, "→", {
        fontSize: "30px",
        color: "#000",
      })
      .setInteractive();

    const closeButton = this.scene.add
      .sprite(width / 2 + 176, height / 2 - 224, "close")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false })
      .setScale(2)
      .setTint(0x666666);

    closeButton.on("pointerdown", () => this.destroy());
    closeButton.on("pointerover", () => {
      this.cursorManager.setState("hover");
      closeButton.setTint(0xff0000);
    });
    closeButton.on("pointerout", () => {
      this.cursorManager.setState("default");
      closeButton.setTint(0x666666);
    });

    // HINT
    this.hintText = this.scene.add
      .text(
        width / 2,
        height / 2 + 230,
        "[←] Anterior         [→] Próxima",
        {
          fontSize: "12px",
          color: "#666",
        },
      )
      .setOrigin(0.5);

    // EVENTOS
    this.prevButton.on("pointerdown", () =>
      this.prevPage(),
    );
    this.nextButton.on("pointerdown", () =>
      this.nextPage(),
    );

    // HOVER
    this.prevButton.setAlpha(0.5);
    this.nextButton.setAlpha(0.5);

    this.prevButton.on("pointerover", () => {
      this.cursorManager.setState("hover");
      this.prevButton.setAlpha(1);
    });

    this.prevButton.on("pointerout", () => {
      this.cursorManager.setState("default");
      this.prevButton.setAlpha(0.5);
    });

    this.nextButton.on("pointerover", () => {
      this.cursorManager.setState("hover");
      this.nextButton.setAlpha(1);
    });

    this.nextButton.on("pointerout", () => {
      this.cursorManager.setState("default");
      this.nextButton.setAlpha(0.5);
    });

    this.container = this.scene.add.container(0, 0, [
      overlay,
      paper,
      this.titleText,
      this.contentText,
      this.scribbleText,
      this.prevButton,
      this.nextButton,
      this.hintText,
      closeButton,
    ]);

    this.container.setDepth(1000);

    this.registerKeyboard();
    this.refresh();
  }

  private registerKeyboard() {
    this.scene.input.keyboard?.on(
      "keydown-RIGHT",
      this.nextPage,
      this,
    );
    this.scene.input.keyboard?.on(
      "keydown-LEFT",
      this.prevPage,
      this,
    );
  }

  private getScribbleText(pageId: string): string {
    switch (pageId) {
      case "interaction":
        return "💡︎ isso aqui eu só entendi depois...";
      case "inventory":
        return "▶ às vezes eu esquecia que tinha isso";
      case "movement":
        return "⚠ andar também é escolher...";
      default:
        return "";
    }
  }

  private updatePage() {
    const page =
      SURVIVAL_GUIDE_PAGES[this.currentPageIndex];

    this.titleText.setText(page.title);
    this.contentText.setText(page.content);

    const scribble = this.getScribbleText(page.id);
    this.scribbleText.setText(scribble);
    this.scribbleText.setVisible(!!scribble);
  }

  private nextPage() {
    if (
      this.currentPageIndex <
      SURVIVAL_GUIDE_PAGES.length - 1
    ) {
      this.currentPageIndex++;
      this.refresh();
    }
  }

  private prevPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.refresh();
    }
  }

  private refresh() {
    this.updatePage();

    this.prevButton.setAlpha(
      this.currentPageIndex === 0 ? 0.2 : 0.5,
    );
    this.nextButton.setAlpha(
      this.currentPageIndex ===
        SURVIVAL_GUIDE_PAGES.length - 1
        ? 0.2
        : 0.5,
    );

    this.animatePage();
  }

  private animatePage() {
    this.scene.tweens.add({
      targets: [
        this.titleText,
        this.contentText,
        this.scribbleText,
      ],
      alpha: 0,
      duration: 50,
      yoyo: true,
    });
  }

  destroy() {
    this.scene.input.keyboard?.off(
      "keydown-RIGHT",
      this.nextPage,
      this,
    );
    this.scene.input.keyboard?.off(
      "keydown-LEFT",
      this.prevPage,
      this,
    );

    this.container.destroy();
  }
}
