// entities/IdCard.ts
import Phaser from "phaser";
import { PlayerGender } from "../config/types/IntroTypes";
import { CareerOptions } from "../game/scenes/intro/components/CareerOptions";
import { COLORS } from "../game/scenes/ui/Utils";

export interface IdCardData {
  name: string;
  gender: PlayerGender;
  faceTexture: string; // Textura do rosto (ex: "male-face", "female-face", etc.)
  bgColor?: number;
  role?: string;
  accessLevel?: string;
}

export class IdCard extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private faceContainer: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private roleText: Phaser.GameObjects.Text;
  private idText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;

  private readonly CARD_WIDTH = 340;
  private readonly CARD_HEIGHT = 220;
  private readonly FACE_SIZE = 120;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: IdCardData,
  ) {
    super(scene, x, y);

    // Configuração com defaults
    const finalConfig = {
      role: "Jogador(a)",
      accessLevel: "BÁSICO",
      bgColor: this.getColorByGender(config.gender),
      ...config,
    };

    this.initCard(finalConfig);
    scene.add.existing(this);
  }

  private initCard(config: IdCardData): void {
    this.setSize(this.CARD_WIDTH, this.CARD_HEIGHT);

    // 1. FUNDO
    this.createBackground(config.bgColor!);

    // 2. FOTO NO ESTILO FACEFRAME (SEM BORDA DOURADA)
    this.createFace(config.faceTexture, config.gender);

    // 3. TEXTO - NOME
    this.createNameText(config.name);

    // 4. TEXTO - CARGO
    this.createRoleText(
      CareerOptions.prototype
        .getCareerOptions()
        .find((career) => career.id === config.role!).title,
    );

    // 5. TEXTO - ID
    this.createIdText();

    // 6. TEXTO - NÍVEL DE ACESSO
    this.createLevelText(config.accessLevel!);

    // 8. DECORAÇÕES
    this.createDecorations();
  }

  private createBackground(color: number): void {
    this.background = this.scene.add.graphics();

    // Fundo principal
    this.background.fillStyle(color, 1);
    this.background.fillRoundedRect(
      -this.CARD_WIDTH / 2,
      -this.CARD_HEIGHT / 2,
      this.CARD_WIDTH,
      this.CARD_HEIGHT,
      15,
    );

    // Sombra interna
    this.background.fillStyle(0x000000, 0.2);
    this.background.fillRoundedRect(
      -this.CARD_WIDTH / 2 + 3,
      -this.CARD_HEIGHT / 2 + 3,
      this.CARD_WIDTH - 6,
      this.CARD_HEIGHT - 6,
      12,
    );

    // Faixa de título
    this.background.fillStyle(0x000000, 0.4);
    this.background.fillRoundedRect(
      -this.CARD_WIDTH / 2,
      -this.CARD_HEIGHT / 2,
      this.CARD_WIDTH,
      40,
      { tl: 15, tr: 15, bl: 0, br: 0 },
    );

    // Título "CRACHÁ DE ACESSO"
    const title = this.scene.add.text(
      -this.CARD_WIDTH / 2 + 20,
      -this.CARD_HEIGHT / 2 + 10,
      "CARTÃO DE ACESSO",
      {
        fontSize: "20px",
        fontFamily: "VT323",
        color: "#FFFFFF",
        fontStyle: "bold",
        letterSpacing: 2,
      },
    );

    this.add([this.background, title]);
  }

  private createFace(
    faceTexture: string,
    gender: PlayerGender,
  ): void {
    const faceX = -this.CARD_WIDTH / 2 + 80;
    const faceY = 15;

    this.faceContainer = this.scene.add.container(
      faceX,
      faceY,
    );

    // Moldura no estilo FaceFrame (sem borda dourada)
    const frameBg = this.scene.add.graphics();
    const frameWidth = this.FACE_SIZE + 20;
    const frameHeight = this.FACE_SIZE + 20;
    const frameColor = this.getGenderColor(gender);

    // Fundo da moldura
    frameBg.fillStyle(0x000000, 0.5);
    frameBg.fillRoundedRect(
      -frameWidth / 2,
      -frameHeight / 2,
      frameWidth,
      frameHeight,
      10,
    );

    // Borda externa colorida (baseada no gênero)
    frameBg.lineStyle(4, frameColor, 1);
    frameBg.strokeRoundedRect(
      -frameWidth / 2,
      -frameHeight / 2,
      frameWidth,
      frameHeight,
      10,
    );

    // Borda interna fina
    frameBg.lineStyle(2, 0xffffff, 0.8);
    frameBg.strokeRoundedRect(
      -frameWidth / 2 + 2,
      -frameHeight / 2 + 2,
      frameWidth - 4,
      frameHeight - 4,
      8,
    );

    // Rosto (usa mesma lógica do FaceFrame)
    if (this.scene.textures.exists(faceTexture)) {
      const faceSprite = this.scene.add
        .sprite(0, 0, faceTexture)
        .setDisplaySize(
          this.FACE_SIZE - 10,
          this.FACE_SIZE - 10,
        )
        .setAlpha(1);
      this.faceContainer.add(faceSprite);
    }

    this.faceContainer.add(frameBg);
    this.add(this.faceContainer);
  }

  private createNameText(name: string): void {
    const textX = -this.CARD_WIDTH / 2 + 180;
    const textY = -this.CARD_HEIGHT / 2 + 50;

    this.nameText = this.scene.add.text(
      textX,
      textY,
      name.toUpperCase(),
      {
        fontSize: "28px",
        fontFamily: "VT323",
        color: "#FFFFFF",
        fontStyle: "bold",
        letterSpacing: 1,
      },
    );

    // Sombra para legibilidade
    this.nameText.setShadow(3, 3, "#000000", 3, true);
    this.add(this.nameText);
  }

  private createRoleText(role: string): void {
    const textX = -this.CARD_WIDTH / 2 + 180;
    const textY = -this.CARD_HEIGHT / 2 + 75;

    this.roleText = this.scene.add.text(
      textX,
      textY,
      role,
      {
        fontSize: "16px",
        fontFamily: "VT323",
        color: "#CCCCCC",
        fontStyle: "italic",
      },
    );
    this.add(this.roleText);
  }

  private createIdText(): void {
    // ID no formato: GAMER-XXXX-XXXX
    const randomPart1 = Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase();
    const randomPart2 = Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase();
    const idNumber = `ZS-${randomPart1}-${randomPart2}`;

    const textX = -this.CARD_WIDTH / 2 + 180;
    const textY = -this.CARD_HEIGHT / 2 + 110;

    this.idText = this.scene.add.text(
      textX,
      textY,
      idNumber,
      {
        fontSize: "16px",
        fontFamily: "VT323",
        color: `#${COLORS.green}`,
        backgroundColor: "rgba(0, 30, 0, 0.7)",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
        letterSpacing: 3,
        align: "center",
      },
    );
    this.add(this.idText);
  }

  private createLevelText(accessLevel: string): void {
    const textX = -this.CARD_WIDTH / 2 + 180;
    const textY = -this.CARD_HEIGHT / 2 + 140;

    this.levelText = this.scene.add.text(
      textX,
      textY,
      `ACESSO ${accessLevel}`,
      {
        fontSize: "12px",
        fontFamily: "VT323",
        color: `#${COLORS.gold}`,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        padding: { left: 10, right: 10, top: 5, bottom: 5 },
        align: "center",
      },
    );

    this.add(this.levelText);
  }

  private createDecorations(): void {
    const decor = this.scene.add.graphics();

    // Linha divisória
    decor.lineStyle(1, 0xffffff, 0.3);
    decor.lineBetween(
      -this.CARD_WIDTH / 2 + 165,
      -this.CARD_HEIGHT / 2 + 60,
      -this.CARD_WIDTH / 2 + 165,
      this.CARD_HEIGHT / 2 - 20,
    );

    // Código de barras simulado
    decor.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 30; i++) {
      const width = Phaser.Math.Between(1, 3);
      const height = Phaser.Math.Between(10, 25);
      const x = this.CARD_WIDTH / 2 - 42 - i * 4;
      const y = this.CARD_HEIGHT / 2 - 45;

      decor.fillRect(x, y, width, height);
    }

    this.add(decor);
  }

  private getColorByGender(gender: PlayerGender): number {
    const colors = {
      male: +`0x${COLORS.blue}`,
      female: +`0x${COLORS.red}`,
      nonbinary: +`0x${COLORS.green}`,
    };

    return colors[gender] || 0x2c3e50;
  }

  private getGenderColor(gender: PlayerGender): number {
    const colors = {
      male: +`0x${COLORS.blue}`,
      female: +`0x${COLORS.red}`,
      nonbinary: +`0x${COLORS.green}`,
    };

    return colors[gender] || 0x95a5a6;
  }

  private convertColorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  public show(): void {
    this.setScale(0.8);
    this.setAlpha(0);

    this.scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 600,
      ease: "Back.out",
      delay: 200,
    });

    // Animação do rosto (pulsação suave)
    this.scene.tweens.add({
      targets: this.faceContainer,
      scale: { from: 0.9, to: 1 },
      duration: 300,
      ease: "Sine.easeOut",
      delay: 600,
    });

    // Efeito de partículas ao redor do rosto (opcional)
    this.createFaceParticles();
  }

  private createFaceParticles(): void {
    if (!this.faceContainer) return;

    const faceX = this.faceContainer.x + this.x;
    const faceY = this.faceContainer.y + this.y;

    for (let i = 0; i < 8; i++) {
      const angle = (360 / 8) * i;
      const particle = this.scene.add.graphics({
        x: faceX,
        y: faceY,
      });
      particle.fillStyle(0xffffff, 0.7);
      particle.fillCircle(0, 0, 2);

      this.scene.tweens.add({
        targets: particle,
        x:
          faceX +
          Math.cos(Phaser.Math.DegToRad(angle)) * 70,
        y:
          faceY +
          Math.sin(Phaser.Math.DegToRad(angle)) * 70,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy(),
        delay: i * 50,
      });
    }
  }

  /**
   * Efeito de validação do crachá
   */
  public playValidationEffect(): void {
    const scanner = this.scene.add.graphics();
    scanner.fillStyle(0x00ff00, 0.8);
    scanner.fillRect(
      -this.CARD_WIDTH / 2,
      -this.CARD_HEIGHT / 2,
      this.CARD_WIDTH,
      4,
    );

    scanner.setDepth(5);
    this.add(scanner);

    // Scanner desce
    this.scene.tweens.add({
      targets: scanner,
      y: this.CARD_HEIGHT / 2,
      duration: 500,
      ease: "Power2",
      onComplete: () => {
        scanner.destroy();
        this.playApprovalEffect();
      },
    });
  }

  private playApprovalEffect(): void {
    const approvalGlow = this.scene.add.graphics();
    approvalGlow.fillStyle(0x00ff00, 0.3);
    approvalGlow.fillRoundedRect(
      -this.CARD_WIDTH / 2 - 5,
      -this.CARD_HEIGHT / 2 - 5,
      this.CARD_WIDTH + 10,
      this.CARD_HEIGHT + 10,
      20,
    );

    approvalGlow.setDepth(-1);
    this.add(approvalGlow);

    this.scene.tweens.add({
      targets: approvalGlow,
      alpha: 0,
      scale: 1.2,
      duration: 800,
      ease: "Power2",
      onComplete: () => approvalGlow.destroy(),
    });

    // Texto "VALIDADO"
    const validatedText = this.scene.add.text(
      this.x,
      this.y + this.CARD_HEIGHT / 2 + 30,
      "✓ VALIDADO",
      {
        fontSize: "24px",
        fontFamily: "VT323",
        color: `#${COLORS.green}`,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: { left: 15, right: 15, top: 8, bottom: 8 },
      },
    );
    validatedText.setOrigin(0.5);
    validatedText.setAlpha(0);

    this.scene.tweens.add({
      targets: validatedText,
      alpha: 1,
      y: "+=10",
      duration: 2000,
      yoyo: true,
      onComplete: () => {
        this.scene.time.delayedCall(1000, () => {
          validatedText.destroy();
        });
      },
    });
  }

  /**
   * Adiciona interatividade ao crachá
   */
  public makeInteractive(): this {
    this.setInteractive(
      new Phaser.Geom.Rectangle(
        -this.CARD_WIDTH / 2,
        -this.CARD_HEIGHT / 2,
        this.CARD_WIDTH,
        this.CARD_HEIGHT,
      ),
      Phaser.Geom.Rectangle.Contains,
    );

    this.on("pointerover", () => {
      this.scene.tweens.add({
        targets: this,
        scale: 1.03,
        duration: 200,
        ease: "Sine.easeOut",
      });
    });

    this.on("pointerout", () => {
      this.scene.tweens.add({
        targets: this,
        scale: 1,
        duration: 200,
        ease: "Sine.easeOut",
      });
    });

    this.on("pointerdown", () => {
      this.scene.tweens.add({
        targets: this,
        scale: 0.98,
        duration: 100,
        yoyo: true,
      });

      this.playValidationEffect();
    });

    return this;
  }
}
