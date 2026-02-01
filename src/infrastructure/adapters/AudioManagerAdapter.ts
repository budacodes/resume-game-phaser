import Phaser from "phaser";
import { AudioPort } from "../../application/ports/AudioPort";
import { AudioManager } from "../../managers/AudioManager";

export class AudioManagerAdapter implements AudioPort {
  constructor(private readonly audio: AudioManager) {}

  playMusic(
    key: string,
    config?: Phaser.Types.Sound.SoundConfig,
  ): void {
    this.audio.playMusic(key, config);
  }

  playSFX(
    key: string,
    config?: Phaser.Types.Sound.SoundConfig,
  ): void {
    this.audio.playSFX(key, config);
  }

  fadeOutMusic(durationMs: number): void {
    this.audio.fadeOutMusic(durationMs);
  }

  fadeInMusic(key: string, durationMs: number): void {
    this.audio.fadeInMusic(key, durationMs);
  }
}
