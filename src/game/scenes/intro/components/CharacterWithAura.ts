import { Scene } from "phaser";
import { PlayerGender } from "../types/IntroTypes";

export class CharacterWithAura {
  private scene: Scene;
  public container: Phaser.GameObjects.Container;
  public characterSprite: Phaser.GameObjects.Sprite;
  private auraSprites: Phaser.GameObjects.Sprite[] = [];

  constructor(scene: Scene, x: number, y: number) {
    this.scene = scene;
    this.container = this.scene.add
      .container(x, y)
      .setDepth(20); // Aumentado depth para ficar na frente
    this.characterSprite = this.scene.add
      .sprite(0, 0, "nonbinary-run")
      .setVisible(false);
  }

  create(gender: PlayerGender = "nonbinary"): void {
    this.destroyAuras();
    this.createCharacter(gender);
    this.setupAnimations(gender);
    this.animateAuras();
  }

  private destroyAuras(): void {
    this.auraSprites.forEach((sprite) => sprite.destroy());
    this.auraSprites = [];
  }

  private createCharacter(gender: PlayerGender): void {
    const spriteKey = `${gender}-run`;

    // Aura externa (mais atrás)
    const outerAura = this.scene.add
      .sprite(0, 0, spriteKey)
      .setScale(5)
      .setTint(0xffffff)
      .setAlpha(1);

    // Aura interna (no meio)
    const innerAura = this.scene.add
      .sprite(0, 0, spriteKey)
      .setScale(4)
      .setTint(0xffffff)
      .setAlpha(1);

    // Personagem principal (na frente)
    this.characterSprite
      .setTexture(spriteKey)
      .setScale(3.5)
      .setAlpha(1)
      .setVisible(true);

    // Limpa container e adiciona na ordem correta
    this.container.removeAll(true);
    this.container.add([
      outerAura,
      innerAura,
      this.characterSprite,
    ]);
    this.auraSprites = [outerAura, innerAura];
  }

  private setupAnimations(gender: PlayerGender): void {
    const animationKey = `${gender}-running-down`;

    // Cria animação se não existir
    if (!this.scene.anims.exists(animationKey)) {
      this.createIdleDownAnimation(
        `${gender}-run`,
        animationKey
      );
    }

    // Aplica animação a todos os sprites
    this.container.each(
      (child: Phaser.GameObjects.GameObject) => {
        if (child instanceof Phaser.GameObjects.Sprite) {
          child.play(animationKey, true);
        }
      }
    );
  }

  private animateAuras(): void {
    if (this.auraSprites.length < 2) return;

    const [outerAura, innerAura] = this.auraSprites;

    this.scene.tweens.add({
      targets: outerAura,
      alpha: { from: 0.1, to: 0.2 },
      scale: { from: 3.75, to: 3.85 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.scene.tweens.add({
      targets: innerAura,
      alpha: { from: 0.2, to: 0.3 },
      scale: { from: 3.6, to: 3.7 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 500,
    });
  }

  updateGender(gender: PlayerGender): void {
    const spriteKey = `${gender}-run`;

    // Atualiza texturas
    this.container.each(
      (child: Phaser.GameObjects.GameObject) => {
        if (child instanceof Phaser.GameObjects.Sprite) {
          child.setTexture(spriteKey);
        }
      }
    );

    // Atualiza animação
    this.setupAnimations(gender);
  }

  fadeOut(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 500,
    });
  }

  destroy(): void {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      ease: "Power2",
      duration: 1000,
    });

    this.auraSprites.forEach((sprite) => {
      this.scene.tweens.add({
        targets: sprite,
        alpha: 0,
        ease: "Power2",
        duration: 1000,
      });
    });

    this.auraSprites = [];
  }

  get sprite(): Phaser.GameObjects.Sprite {
    return this.characterSprite;
  }

  private createIdleDownAnimation(
    textureKey: string,
    animationKey: string
  ): void {
    this.scene.anims.create({
      key: animationKey,
      frames: this.scene.anims.generateFrameNumbers(
        textureKey,
        {
          start: 6,
          end: 8,
        }
      ),
      frameRate: 6,
      repeat: -1,
    });
  }
}
