import { AudioManager } from "../../../../managers/AudioManager";

export class AudioSystem {
  constructor(private readonly audio: AudioManager) {}

  setup(): void {
    this.audio.createSound("type", "typing", {
      volume: 0.5,
    });
    this.audio.createSound("delete", "delete_char", {
      volume: 0.5,
    });
    this.audio.createSound("select", "snd_select", {
      volume: 0.4,
    });
    this.audio.createSound("confirm", "snd_confirm", {
      volume: 0.5,
    });
    this.audio.createSound("error", "snd_error", {
      volume: 0.5,
    });
  }

  stopTypeSound(): void {
    this.audio.stopTypeSound();
  }

  playTypeSound(): void {
    this.audio.playTypeSound();
  }

  stopDeleteCharSound(): void {
    this.audio.stopDeleteSound();
  }

  playDeleteCharSound(): void {
    this.audio.playDeleteSound();
  }

  playSelect(): void {
    this.audio.playSelectSound();
  }

  playConfirm(): void {
    this.audio.playConfirmSound();
  }

  playError(): void {
    this.audio.playErrorSound();
  }

  fadeOutMusic(duration: number = 1500): void {
    this.audio.fadeOutMusic(duration);
  }

  stopMusic(): void {
    this.audio.stopMusic();
  }
}
