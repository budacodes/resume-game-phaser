import { Scene } from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext.js";
import { CursorPort } from "../../../../application/ports/CursorPort";
import { CursorManagerAdapter } from "../../../../infrastructure/adapters/CursorManagerAdapter";
import { CursorManager } from "../../../../managers/CursorManager";
import { COLORS } from "../Utils";

export class BusinessCard {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;

  private bg!: Phaser.GameObjects.Graphics;
  private shadow!: Phaser.GameObjects.Graphics;
  private title!: BBCodeText;
  private subtitle!: BBCodeText;

  private width = 560;
  private height = 280;

  private cursorManager!: CursorPort;

  private avatar!: Phaser.GameObjects.Image;

  constructor(scene: Scene, cursor?: CursorPort) {
    this.scene = scene;
    const cam = this.scene.cameras.main;
    this.container = this.scene.add
      .container(cam.centerX, cam.centerY)
      .setDepth(2000)
      .setVisible(false);

    this.cursorManager =
      cursor ??
      new CursorManagerAdapter(CursorManager.getInstance());

    this.createBox();
  }

  private createBox() {
    const { width, height } = this;

    // Shadow (igual DialogBox)
    this.shadow = this.scene.add.graphics();
    this.shadow
      .fillStyle(0x000000, 0.5)
      .fillRoundedRect(
        -width / 2 + 4,
        -height / 2 + 4,
        width,
        height,
        12,
      );

    // Background (igual DialogBox)
    this.bg = this.scene.add.graphics();
    this.bg
      .fillStyle(0x222222, 0.95)
      .lineStyle(2, 0xffffff, 0.8)
      .fillRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        12,
      )
      .strokeRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        12,
      );

    this.avatar = this.scene.add
      .image(0, -142, "profile")
      .setDisplaySize(128, 128)
      .setOrigin(0.5);

    const maskShape = this.scene.add.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillCircle(
      this.container.x,
      this.container.y - 142,
      64,
    );

    this.avatar.setMask(maskShape.createGeometryMask());
    maskShape.setVisible(false);

    const border = this.scene.add.graphics();
    border.lineStyle(2, 0xffffff, 0.8);
    border.strokeCircle(0, -142, 70);

    // Texto principal
    this.title = new BBCodeText(
      this.scene,
      0,
      -24,
      "Marcio Câmara (Buda)",
      {
        fontFamily: "VT323",
        fontSize: "36px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: width - 40 },
      },
    ).setOrigin(0.5);

    this.subtitle = new BBCodeText(
      this.scene,
      0,
      16,
      "Engenheiro Front-End Sênior | Especialista em Angular & Tech Lead | Micro-frontends | Foco em UX/UI",
      {
        fontFamily: "VT323",
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: width - 40 },
      },
    ).setOrigin(0.5);

    const linkedin = this.scene.add
      .image(-132, 80, "linkedin")
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5);
    linkedin.setScale(48 / linkedin.width);

    const whatsapp = this.scene.add
      .image(-44, 80, "whatsapp")
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5);
    whatsapp.setScale(48 / whatsapp.width);

    const github = this.scene.add
      .image(44, 80, "github")
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5);
    github.setScale(48 / github.width);

    const instagram = this.scene.add
      .image(132, 80, "instagram")
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5);
    instagram.setScale(48 / instagram.width);

    const closeButton = this.scene.add
      .sprite(this.width / 2 - 32, -112, "close")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false })
      .setScale(2);
    closeButton.setScale(20 / closeButton.width);

    // Hovers
    linkedin.on("pointerover", () => {
      linkedin.setScale((48 / instagram.width) * 1.25);
      this.cursorManager.setState("hover");
    });

    linkedin.on("pointerout", () => {
      linkedin.setScale(48 / instagram.width);
      this.cursorManager.setState("default");
    });

    whatsapp.on("pointerover", () => {
      whatsapp.setScale((48 / whatsapp.width) * 1.25);
      this.cursorManager.setState("hover");
    });

    whatsapp.on("pointerout", () => {
      whatsapp.setScale(48 / whatsapp.width);
      this.cursorManager.setState("default");
    });

    github.on("pointerover", () => {
      github.setScale((48 / github.width) * 1.25);
      this.cursorManager.setState("hover");
    });

    github.on("pointerout", () => {
      github.setScale(48 / github.width);
      this.cursorManager.setState("default");
    });

    instagram.on("pointerover", () => {
      instagram.setScale((48 / instagram.width) * 1.25);
      this.cursorManager.setState("hover");
    });

    instagram.on("pointerout", () => {
      instagram.setScale(48 / instagram.width);
      this.cursorManager.setState("default");
    });

    closeButton.on("pointerover", () => {
      this.cursorManager.setState("hover");
      closeButton.setTintFill(+`0x${COLORS.red}`);
    });

    closeButton.on("pointerout", () => {
      this.cursorManager.setState("default");
      closeButton.setTintFill(0xffffff);
    });

    // Clicks
    linkedin.on("pointerdown", () => {
      window.open(
        "https://www.linkedin.com/in/budacodes/",
        "_blank",
      );
    });

    whatsapp.on("pointerdown", () => {
      window.open("https://wa.me/5519995174367/", "_blank");
    });

    github.on("pointerdown", () => {
      window.open("https://github.com/budacodes", "_blank");
    });

    instagram.on("pointerdown", () => {
      window.open(
        "https://instagram.com/budacodes",
        "_blank",
      );
    });

    closeButton.on("pointerdown", () => {
      this.hide();
    });

    this.container.add([
      this.shadow,
      this.bg,
      closeButton,
      maskShape,
      this.avatar,
      border,
      this.title,
      this.subtitle,
      linkedin,
      whatsapp,
      github,
      instagram,
    ]);
  }

  public show() {
    this.container.setScrollFactor(0);

    const cam = this.scene.cameras.main;
    this.container.setPosition(cam.centerX, cam.centerY);

    this.container.setScale(1);
    this.container.setVisible(true);

    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      duration: 300,
      ease: "Back.Out",
    });
  }

  public hide() {
    this.scene.tweens.add({
      targets: this.container,
      scale: 0,
      duration: 200,
      ease: "Back.In",
      onComplete: () => {
        this.container.setVisible(false);
      },
    });
  }
}
