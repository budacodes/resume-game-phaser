import { Scene } from "phaser";
import { PlayerGender } from "../../../../config/types/IntroTypes";
import { INTRO_CONFIG } from "../config/IntroConfig";

export class FaceFrame {
  private scene: Scene;
  private frames: Map<
    string,
    Phaser.GameObjects.Container
  > = new Map();
  currentFrame: Phaser.GameObjects.Container | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  create(gender: PlayerGender, x: number, y: number): void {
    const container = this.scene.add
      .container(x, y)
      .setDepth(5); // Depth menor que o personagem (20)
    const frameWidth = 250;
    const frameHeight = 250;

    this.addFace(container, gender);
    this.addFrame(
      container,
      gender,
      frameWidth,
      frameHeight
    );

    container.setAlpha(0);
    this.frames.set(gender, container);
    this.currentFrame = container;
  }

  public hideAll(): void {
    this.frames.forEach((container) => {
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        scale: 0.8,
        duration: 500,
        onComplete: () => container.setVisible(false),
      });
    });
    this.currentFrame = null;
  }

  private addFace(
    container: Phaser.GameObjects.Container,
    gender: PlayerGender
  ): void {
    const faceTexture = `${gender}-face`;

    if (this.scene.textures.exists(faceTexture)) {
      const faceSprite = this.scene.add
        .sprite(0, 0, faceTexture)
        .setDisplaySize(200, 200)
        .setAlpha(1)
        .setDepth(0);
      container.add(faceSprite);
    } else {
      const symbol =
        gender === "male"
          ? "♂"
          : gender === "female"
          ? "♀"
          : "⚧";
      const symbolText = this.scene.add
        .text(0, 0, symbol, {
          fontFamily: "VT323",
          fontSize: "100px",
          color: this.convertColorToString(
            INTRO_CONFIG.colors[gender]
          ),
        })
        .setOrigin(0.5)
        .setAlpha(1)
        .setDepth(0);
      container.add(symbolText);
    }
  }

  private addFrame(
    container: Phaser.GameObjects.Container,
    gender: PlayerGender,
    width: number,
    height: number
  ): void {
    if (this.scene.textures.exists("frame-gold")) {
      const frameImage = this.scene.add
        .image(0, 0, "frame-gold")
        .setDisplaySize(width, height)
        .setAlpha(1)
        .setDepth(1);
      container.add(frameImage);
    } else {
      const frameBg = this.scene.add.graphics();
      const color = INTRO_CONFIG.colors[gender];

      frameBg.fillStyle(0x000000, 0.3);
      frameBg.fillRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        20
      );

      frameBg.lineStyle(8, color, 1);
      frameBg.strokeRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        20
      );

      frameBg.lineStyle(4, 0xffd700, 0.8);
      frameBg.strokeRoundedRect(
        -width / 2 + 5,
        -height / 2 + 5,
        width - 10,
        height - 10,
        15
      );

      frameBg.setDepth(1);
      container.add(frameBg);
    }
  }

  show(gender: PlayerGender): void {
    // Se o gênero que queremos mostrar já é o atual e ele está visível, não faz nada
    if (
      this.currentFrame &&
      this.currentFrame.name === gender &&
      this.currentFrame.alpha > 0
    ) {
      return;
    }

    // Esconde o anterior sem destruir (ou apenas inicia o fade out)
    if (this.currentFrame) {
      this.scene.tweens.add({
        targets: this.currentFrame,
        alpha: 0,
        scale: 0.8,
        duration: 200,
      });
    }

    let frame = this.frames.get(gender);

    if (!frame) {
      this.create(gender, this.scene.scale.width / 2, 200);
      frame = this.frames.get(gender)!;
    }

    this.scene.tweens.killTweensOf(frame);
    frame.setAlpha(0).setScale(0.8).setVisible(true);

    this.scene.tweens.add({
      targets: frame,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: "Back.easeOut",
    });

    this.currentFrame = frame;
  }

  createParticles(
    x: number,
    y: number,
    gender: PlayerGender
  ): void {
    const color = INTRO_CONFIG.colors[gender];

    for (let i = 0; i < 15; i++) {
      const angle = Phaser.Math.Between(0, 360);
      const distance = Phaser.Math.Between(80, 120);

      const particle = this.scene.add.graphics({ x, y });
      particle.fillStyle(color, 0.8);
      particle.fillCircle(0, 0, Phaser.Math.Between(2, 4));

      this.scene.tweens.add({
        targets: particle,
        x:
          x +
          Math.cos(Phaser.Math.DegToRad(angle)) * distance,
        y:
          y +
          Math.sin(Phaser.Math.DegToRad(angle)) * distance,
        alpha: 0,
        scale: 0,
        duration: 800,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private convertColorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  destroy(): void {
    this.scene.tweens.add({
      targets: this.currentFrame,
      alpha: 0,
      ease: "Power2",
      duration: 1000,
    });
  }
}
