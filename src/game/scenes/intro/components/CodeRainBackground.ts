import { Scene } from "phaser";
import { INTRO_CONFIG } from "../config/IntroConfig";

interface CodeChar {
  text: Phaser.GameObjects.Text;
  speed: number;
  waveOffset: number;
  createdAt: number;
}

export class CodeRainBackground {
  private scene: Scene;
  private codeChars: CodeChar[] = [];
  private readonly CODE_CHARS = "01{}();:.=+-*/&|!?<>[]";
  private readonly MAX_CHARS = 100;
  private readonly COLUMNS = 20;
  private readonly ROWS = 30;
  private columnPositions: number[] = [];
  private waveTime = 0;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  create(): void {
    this.setupColumnPositions();
    this.createInitialChars();
    this.startWaveAnimation();
  }

  private setupColumnPositions(): void {
    const columnWidth =
      this.scene.scale.width / this.COLUMNS;

    for (let i = 0; i < this.COLUMNS; i++) {
      this.columnPositions.push(
        i * columnWidth + columnWidth / 2
      );
    }
  }

  private createInitialChars(): void {
    for (let i = 0; i < this.MAX_CHARS; i++) {
      this.createCodeChar();
    }
  }

  private createCodeChar(): void {
    const columnIndex = Phaser.Math.Between(
      0,
      this.COLUMNS - 1
    );
    const x = this.columnPositions[columnIndex];
    const y = Phaser.Math.Between(-100, -50);

    const char =
      this.CODE_CHARS[
        Math.floor(Math.random() * this.CODE_CHARS.length)
      ];

    const text = this.scene.add
      .text(x, y, char, {
        fontFamily: "VT323",
        fontSize: this.getRandomSize(),
        color: this.getRandomColor(),
      })
      .setOrigin(0.5)
      .setAlpha(0.7 + Math.random() * 0.3);

    const speed = 30 + Math.random() * 70;
    const waveOffset = Math.random() * Math.PI * 2;

    this.codeChars.push({
      text,
      speed,
      waveOffset,
      createdAt: this.scene.time.now,
    });
  }

  private getRandomSize(): string {
    const sizes = ["12px", "14px", "16px", "18px", "20px"];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private getRandomColor(): string {
    const colors = [
      INTRO_CONFIG.colors.budaGlow,
      0x4cc9f0, // Azul claro
      0x2ecc71, // Verde
      0x9b59b6, // Roxo
      0xe74c3c, // Vermelho
      0xf1c40f, // Amarelo
      0x1abc9c, // Turquesa
    ];

    const color =
      colors[Math.floor(Math.random() * colors.length)];
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  private startWaveAnimation(): void {
    this.scene.time.addEvent({
      delay: 16, // ≈60 FPS
      callback: this.update.bind(this),
      callbackScope: this,
      loop: true,
    });
  }

  update(): void {
    this.waveTime += 0.05;

    // Atualiza cada caractere
    this.codeChars.forEach((codeChar, index) => {
      // Movimento para baixo
      codeChar.text.y += codeChar.speed / 60;

      // Efeito de onda lateral
      const waveAmount =
        Math.sin(this.waveTime + codeChar.waveOffset) * 10;
      codeChar.text.x =
        this.columnPositions[this.getColumnForChar(index)] +
        waveAmount;

      // Efeito de fade in/out
      const age = this.scene.time.now - codeChar.createdAt;
      const fadeInDuration = 500;

      if (age < fadeInDuration) {
        codeChar.text.alpha = (age / fadeInDuration) * 0.8;
      }

      // Efeito de piscar aleatório
      if (Math.random() < 0.01) {
        this.scene.tweens.add({
          targets: codeChar.text,
          alpha: { from: codeChar.text.alpha, to: 1 },
          duration: 100,
          yoyo: true,
          repeat: 1,
        });
      }

      // Remove caracteres que saíram da tela
      if (codeChar.text.y > this.scene.scale.height + 50) {
        this.recycleChar(index);
      }
    });

    // Adiciona novos caracteres ocasionalmente
    if (
      this.codeChars.length < this.MAX_CHARS &&
      Math.random() < 0.3
    ) {
      this.createCodeChar();
    }
  }

  private getColumnForChar(index: number): number {
    return index % this.COLUMNS;
  }

  private recycleChar(index: number): void {
    const codeChar = this.codeChars[index];

    // Reutiliza o mesmo objeto de texto
    codeChar.text.y = Phaser.Math.Between(-100, -50);
    codeChar.text.x =
      this.columnPositions[this.getColumnForChar(index)];
    codeChar.text.setText(
      this.CODE_CHARS[
        Math.floor(Math.random() * this.CODE_CHARS.length)
      ]
    );
    codeChar.text.setColor(this.getRandomColor());
    codeChar.text.setFontSize(this.getRandomSize());
    codeChar.createdAt = this.scene.time.now;
    codeChar.speed = 30 + Math.random() * 70;

    // Efeito de brilho ao reaparecer
    this.scene.tweens.add({
      targets: codeChar.text,
      alpha: { from: 0, to: 0.8 },
      duration: 300,
    });
  }

  // Método para criar efeito especial (pode ser chamado em eventos)
  createMatrixEffect(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      this.scene.time.delayedCall(i * 50, () => {
        this.createExplosionEffect(x, y);
      });
    }
  }

  private createExplosionEffect(
    x: number,
    y: number
  ): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = 50 + Math.random() * 100;

      const char =
        this.CODE_CHARS[
          Math.floor(Math.random() * this.CODE_CHARS.length)
        ];

      const text = this.scene.add
        .text(x, y, char, {
          fontFamily: "VT323",
          fontSize: "18px",
          color: this.getRandomColor(),
        })
        .setOrigin(0.5)
        .setAlpha(1);

      this.scene.tweens.add({
        targets: text,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 2,
        duration: 1000,
        ease: "Power2",
        onComplete: () => text.destroy(),
      });
    }
  }

  // Método para criar trail de um caractere (para quando o mouse se move)
  createTrail(x: number, y: number): void {
    const char =
      this.CODE_CHARS[
        Math.floor(Math.random() * this.CODE_CHARS.length)
      ];

    const text = this.scene.add
      .text(x, y, char, {
        fontFamily: "VT323",
        fontSize: "24px",
        color: this.getRandomColor(),
      })
      .setOrigin(0.5)
      .setAlpha(0.8);

    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      y: y - 20,
      scale: 1.5,
      duration: 800,
      ease: "Sine.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  // Método para criar onda de choque (para quando algo importante acontece)
  createShockwave(x: number, y: number): void {
    const wave = this.scene.add.graphics();
    wave.fillStyle(INTRO_CONFIG.colors.budaGlow, 0.3);
    wave.fillCircle(0, 0, 10);

    this.scene.tweens.add({
      targets: wave,
      scale: 30,
      alpha: 0,
      duration: 1000,
      ease: "Power2",
      onComplete: () => wave.destroy(),
    });

    wave.setPosition(x, y);
  }

  destroy(): void {
    this.codeChars.forEach((codeChar) =>
      codeChar.text.destroy()
    );
    this.codeChars = [];
  }
}
