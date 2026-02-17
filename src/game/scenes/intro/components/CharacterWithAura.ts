import { Scene } from "phaser";
import { PlayerGender } from "../../../../config/types/IntroTypes";

export class CharacterWithAura {
  private scene: Scene;
  public container: Phaser.GameObjects.Container;
  public characterSprite: Phaser.GameObjects.Sprite;
  private auraSprites: Phaser.GameObjects.Sprite[] = [];
  private auraPreset: "sutil" | "normal" | "forte" = "normal";

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
    this.auraSprites.forEach((sprite) => {
      this.scene.tweens.killTweensOf(sprite);
      this.container.remove(sprite);
      sprite.destroy();
    });
    this.auraSprites = [];
  }

  private createCharacter(gender: PlayerGender): void {
    const spriteKey = `${gender}-run`;
    const [outerColor, innerColor] = this.getAuraColors(gender);
    const profile = this.getAuraProfile();

    // Aura externa (mais atrás)
    const outerAura = this.scene.add
      .sprite(0, 0, spriteKey)
      .setScale(profile.outerBaseScale)
      .setTint(outerColor)
      .setAlpha(profile.outerBaseAlpha)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Aura interna (no meio)
    const innerAura = this.scene.add
      .sprite(0, 0, spriteKey)
      .setScale(profile.innerBaseScale)
      .setTint(innerColor)
      .setAlpha(profile.innerBaseAlpha)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Personagem principal (na frente)
    this.characterSprite
      .setTexture(spriteKey)
      .setScale(3.5)
      .setAlpha(1)
      .setVisible(true);

    // Limpa container e adiciona na ordem correta
    this.container.removeAll(false);
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
    const profile = this.getAuraProfile();
    this.scene.tweens.killTweensOf(outerAura);
    this.scene.tweens.killTweensOf(innerAura);

    this.scene.tweens.add({
      targets: outerAura,
      alpha: {
        from: profile.outerAlphaFrom,
        to: profile.outerAlphaTo,
      },
      scale: {
        from: profile.outerScaleFrom,
        to: profile.outerScaleTo,
      },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.scene.tweens.add({
      targets: innerAura,
      alpha: {
        from: profile.innerAlphaFrom,
        to: profile.innerAlphaTo,
      },
      scale: {
        from: profile.innerScaleFrom,
        to: profile.innerScaleTo,
      },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      delay: 500,
    });
  }

  updateGender(gender: PlayerGender): void {
    const spriteKey = `${gender}-run`;
    const animationKey = `${gender}-running-down`;
    const [outerColor, innerColor] = this.getAuraColors(gender);

    // 1. Verificação de segurança: se já for esse gênero e a animação já estiver tocando, ignore.
    if (
      this.characterSprite.texture.key === spriteKey &&
      this.characterSprite.anims.currentAnim?.key ===
        animationKey
    ) {
      return;
    }

    // 2. Garante que a animação exista antes de trocar
    if (!this.scene.anims.exists(animationKey)) {
      this.createIdleDownAnimation(spriteKey, animationKey);
    }

    // 3. Atualiza todos os sprites (incluindo as auras)
    this.container.each(
      (child: Phaser.GameObjects.GameObject) => {
        if (child instanceof Phaser.GameObjects.Sprite) {
          // Paramos a animação atual para não haver conflito de frames
          child.anims.stop();
          child.setTexture(spriteKey);
          child.play(animationKey, true);
        }
      }
    );

    if (this.auraSprites[0]) {
      this.auraSprites[0].setTint(outerColor);
    }
    if (this.auraSprites[1]) {
      this.auraSprites[1].setTint(innerColor);
    }
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

  private getAuraColors(
    gender: PlayerGender,
  ): [number, number] {
    switch (gender) {
      case "female":
        return [0xff7bc6, 0xffc2e5];
      case "male":
        return [0x5db8ff, 0xa7d8ff];
      default:
        return [0xcf8cff, 0xe3bfff];
    }
  }

  public setAuraPreset(
    preset: "sutil" | "normal" | "forte",
  ): void {
    this.auraPreset = preset;
    this.animateAuras();
  }

  private getAuraProfile(): {
    outerBaseScale: number;
    innerBaseScale: number;
    outerBaseAlpha: number;
    innerBaseAlpha: number;
    outerScaleFrom: number;
    outerScaleTo: number;
    innerScaleFrom: number;
    innerScaleTo: number;
    outerAlphaFrom: number;
    outerAlphaTo: number;
    innerAlphaFrom: number;
    innerAlphaTo: number;
  } {
    switch (this.auraPreset) {
      case "sutil":
        return {
          outerBaseScale: 3.95,
          innerBaseScale: 3.7,
          outerBaseAlpha: 0.2,
          innerBaseAlpha: 0.28,
          outerScaleFrom: 3.85,
          outerScaleTo: 4.05,
          innerScaleFrom: 3.6,
          innerScaleTo: 3.8,
          outerAlphaFrom: 0.14,
          outerAlphaTo: 0.28,
          innerAlphaFrom: 0.2,
          innerAlphaTo: 0.34,
        };
      case "normal":
        return {
          outerBaseScale: 4.2,
          innerBaseScale: 3.9,
          outerBaseAlpha: 0.32,
          innerBaseAlpha: 0.4,
          outerScaleFrom: 4.05,
          outerScaleTo: 4.25,
          innerScaleFrom: 3.75,
          innerScaleTo: 3.95,
          outerAlphaFrom: 0.22,
          outerAlphaTo: 0.42,
          innerAlphaFrom: 0.3,
          innerAlphaTo: 0.5,
        };
      case "forte":
      default:
        return {
          outerBaseScale: 4.55,
          innerBaseScale: 4.2,
          outerBaseAlpha: 0.46,
          innerBaseAlpha: 0.58,
          outerScaleFrom: 4.35,
          outerScaleTo: 4.65,
          innerScaleFrom: 4.05,
          innerScaleTo: 4.35,
          outerAlphaFrom: 0.36,
          outerAlphaTo: 0.62,
          innerAlphaFrom: 0.48,
          innerAlphaTo: 0.76,
        };
    }
  }
}
