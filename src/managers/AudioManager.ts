// managers/AudioManager.ts
import { Scene, Sound } from "phaser";
import { SettingsManager } from "./SettingsManager";

export class AudioManager {
  private scene: Scene;
  private settingsManager: SettingsManager;
  private musicSounds: Map<
    string,
    Sound.WebAudioSound | Sound.HTML5AudioSound
  > = new Map();
  private sfxSounds: Map<
    string,
    Sound.WebAudioSound | Sound.HTML5AudioSound
  > = new Map();
  private currentMusic: string | null = null;
  private musicVolume: number = 1;
  private sfxVolume: number = 1;

  private hasFocus = true;
  private wasMusicPlayingBeforeBlur = false;

  constructor(scene: Scene) {
    this.scene = scene;
    this.settingsManager = SettingsManager.getInstance();

    // Configura listeners para mudanças de volume
    this.setupVolumeListeners();
    this.setupFocusListeners();

    // Atualiza volumes inicialmente
    this.updateVolumes();
  }

  public preloadMusic(key: string, path: string): void {
    this.scene.load.audio(key, path);
  }

  public preloadSFX(key: string, path: string): void {
    this.scene.load.audio(key, path);
  }

  public playMusic(
    key: string,
    config: Phaser.Types.Sound.SoundConfig = {}
  ): void {
    if (this.currentMusic === key) return;

    // Para música atual se houver
    this.stopMusic();

    // Toca a nova música
    const music = this.scene.sound.add(key, {
      loop: true,
      volume: this.musicVolume,
      ...config,
    }) as Sound.WebAudioSound | Sound.HTML5AudioSound;

    music.play();
    this.musicSounds.set(key, music);
    this.currentMusic = key;
  }

  public stopMusic(): void {
    if (this.currentMusic) {
      const music = this.musicSounds.get(this.currentMusic);
      if (music && music.isPlaying) {
        music.stop();
      }
      this.currentMusic = null;
    }
  }

  public pauseMusic(): void {
    if (this.currentMusic) {
      const music = this.musicSounds.get(this.currentMusic);
      if (music && music.isPlaying) {
        music.pause();
      }
    }
  }

  public resumeMusic(): void {
    if (this.currentMusic) {
      const music = this.musicSounds.get(this.currentMusic);
      if (music && !music.isPlaying) {
        music.resume();
      }
    }
  }

  public playSFX(
    key: string,
    config: Phaser.Types.Sound.SoundConfig = {}
  ): void {
    // Cria um novo som SFX
    const sfx = this.scene.sound.add(key, {
      volume: this.sfxVolume,
      ...config,
    }) as Sound.WebAudioSound | Sound.HTML5AudioSound;

    sfx.play();
    const soundId = `${key}_${Date.now()}`;
    this.sfxSounds.set(soundId, sfx);

    // Remove da memória após tocar (se não for loop)
    if (!config.loop) {
      sfx.on("complete", () => {
        this.cleanupSFX(soundId);
      });
    }
  }

  private cleanupSFX(id: string): void {
    const sfx = this.sfxSounds.get(id);
    if (sfx) {
      sfx.destroy();
      this.sfxSounds.delete(id);
    }
  }

  private setupFocusListeners(): void {
    // Quando troca de aba / Alt+Tab / outro app
    window.addEventListener("blur", () => {
      if (!this.hasFocus) return;

      this.hasFocus = false;

      // Salva estado da música
      this.wasMusicPlayingBeforeBlur =
        this.isMusicPlaying();

      // Pausa TUDO
      this.scene.sound.pauseAll();
    });

    window.addEventListener("focus", () => {
      if (this.hasFocus) return;

      this.hasFocus = true;

      // Retoma apenas se antes estava tocando
      if (this.wasMusicPlayingBeforeBlur) {
        this.scene.sound.resumeAll();
      }
    });
  }

  private setupVolumeListeners(): void {
    this.scene.game.events.on(
      SettingsManager.EVENTS.VOLUME_CHANGED,
      (volumes: { music: number; sfx: number }) => {
        this.updateVolumes(volumes);
      },
      this
    );
  }

  private updateVolumes(volumes?: {
    music: number;
    sfx: number;
  }): void {
    const settings = this.settingsManager.getSettings();

    // Valores base salvos (0 a 1)
    const baseMusic = settings.musicVolume ?? 1;
    const baseSFX = settings.sfxVolume ?? 1;
    const master = settings.masterVolume ?? 1;

    // Volume final calculado
    this.musicVolume = baseMusic * master;
    this.sfxVolume = baseSFX * master;

    // Aplicar ao sistema do Phaser
    this.scene.sound.volume = master;

    // Atualiza os sons que já estão tocando
    this.musicSounds.forEach((m) =>
      m.setVolume(this.musicVolume)
    );
    this.sfxSounds.forEach((s) =>
      s.setVolume(this.sfxVolume)
    );
  }

  // Métodos para controlar volumes individualmente
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  public setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  // Métodos para fade in/out
  public fadeOutMusic(duration: number = 1000): void {
    if (this.currentMusic) {
      const music = this.musicSounds.get(this.currentMusic);
      if (music && music.isPlaying) {
        this.scene.tweens.add({
          targets: music,
          volume: 0,
          duration: duration,
          onComplete: () => {
            this.stopMusic();
          },
        });
      }
    }
  }

  public fadeInMusic(
    key: string,
    duration: number = 1000
  ): void {
    this.playMusic(key, { volume: 0 });
    const music = this.musicSounds.get(key);
    if (music) {
      this.scene.tweens.add({
        targets: music,
        volume: this.musicVolume,
        duration: duration,
      });
    }
  }

  // Métodos para verificar estado
  public isMusicPlaying(): boolean {
    return this.currentMusic !== null;
  }

  public getCurrentMusic(): string | null {
    return this.currentMusic;
  }

  public destroy(): void {
    // Para todos os sons
    this.musicSounds.forEach((music) => {
      if (music.isPlaying) music.stop();
      music.destroy();
    });

    this.sfxSounds.forEach((sfx) => {
      if (sfx.isPlaying) sfx.stop();
      sfx.destroy();
    });

    // Limpa os maps
    this.musicSounds.clear();
    this.sfxSounds.clear();

    // Remove listeners
    this.scene.game.events.off(
      SettingsManager.EVENTS.VOLUME_CHANGED
    );

    this.currentMusic = null;
  }
}
