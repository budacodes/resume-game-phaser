import { Scene } from "phaser";

export class AudioSystem {
  private scene: Scene;
  private typeSounds: Phaser.Sound.BaseSound[] = [];
  private selectSound!: Phaser.Sound.BaseSound;
  private confirmSound!: Phaser.Sound.BaseSound;
  private errorSound!: Phaser.Sound.BaseSound;
  private bgMusic!: Phaser.Sound.BaseSound;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  setup(): void {
    this.typeSounds = [
      this.scene.sound.add("type_1", { volume: 0.1 }),
      this.scene.sound.add("type_2", { volume: 0.5 }),
      this.scene.sound.add("type_3", { volume: 0.2 }),
    ];

    this.selectSound = this.scene.sound.add("snd_select", {
      volume: 0.4,
    });
    this.confirmSound = this.scene.sound.add(
      "snd_confirm",
      { volume: 0.5 }
    );
    this.errorSound = this.scene.sound.add("snd_error", {
      volume: 0.5,
    });
    this.bgMusic = this.scene.sound.add("intro_music", {
      volume: 0.08,
      loop: true,
    });

    if (!this.scene.sound.locked) {
      this.bgMusic.play();
    }
  }

  playTypeSound(): void {
    if (this.typeSounds.length === 0) return;

    const randomSound =
      this.typeSounds[
        Math.floor(Math.random() * this.typeSounds.length)
      ];
    randomSound.play({
      rate: 0.85 + Math.random() * 0.3,
      volume: 0.05,
      detune: Math.random() * 200 - 100,
    });
  }

  playSelect(): void {
    this.selectSound.play({ volume: 0.2 });
  }

  playConfirm(): void {
    this.confirmSound.play({ rate: 1.2, volume: 0.3 });
  }

  playError(): void {
    this.errorSound.play();
  }

  fadeOutMusic(duration: number = 1500): void {
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.scene.tweens.add({
        targets: this.bgMusic,
        volume: 0,
        duration: duration,
        onComplete: () => this.bgMusic.stop(),
      });
    }
  }

  stopMusic(): void {
    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }
  }
}
