import Phaser from "phaser";

export interface AudioPort {
  playMusic(
    key: string,
    config?: Phaser.Types.Sound.SoundConfig,
  ): void;
  playSFX(
    key: string,
    config?: Phaser.Types.Sound.SoundConfig,
  ): void;
  fadeOutMusic(durationMs: number): void;
  fadeInMusic(key: string, durationMs: number): void;
}
