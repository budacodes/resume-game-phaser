// managers/SettingsManager.ts
import { Game } from "phaser";

export class SettingsManager {
  private static instance: SettingsManager;
  private game: Game;
  private currentSettings: any;
  private uiScaleMultiplier: number = 1;

  // Eventos
  public static readonly EVENTS = {
    SETTINGS_CHANGED: "settings-changed",
    FONT_SIZE_CHANGED: "font-size-changed",
    VOLUME_CHANGED: "volume-changed",
    UI_SETTINGS_CHANGED: "ui_settings_changed",
  };

  private constructor(game: Game) {
    this.game = game;

    // Carrega configurações salvas ou usa padrão
    this.currentSettings = this.loadSettings();

    // Aplica as configurações inicialmente
    this.applySettings();

    // Configura eventos
    this.setupEvents();
  }

  public static getInstance(game?: Game): SettingsManager {
    if (!SettingsManager.instance) {
      if (!game) {
        // Se tentar pegar a instância sem o game pela primeira vez, dá erro
        throw new Error(
          "SettingsManager precisa do objeto Game na primeira inicialização!"
        );
      }
      SettingsManager.instance = new SettingsManager(game);
    }
    return SettingsManager.instance;
  }

  private loadSettings(): any {
    const saved = localStorage.getItem("gameSettings");
    const defaults: any = {
      masterVolume: 1.0,
      musicVolume: 1.0,
      sfxVolume: 1.0,
      uiScale: 1.0,
      fontSize: 0.5,
      language: "PT-BR",
      fullscreen: false,
    };

    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Erro ao carregar configurações:", e);
      }
    }

    return defaults;
  }

  public saveSettings(): void {
    try {
      localStorage.setItem(
        "gameSettings",
        JSON.stringify(this.currentSettings)
      );
    } catch (e) {
      console.error("Erro ao salvar configurações:", e);
    }
  }

  public getSettings(): any {
    return { ...this.currentSettings };
  }

  public updateSettings(newSettings: Partial<any>): void {
    const oldSettings = { ...this.currentSettings };
    this.currentSettings = {
      ...this.currentSettings,
      ...newSettings,
    };

    // Aplica as mudanças
    this.applySettings();

    // Salva automaticamente
    this.saveSettings();

    // Dispara evento de mudanças
    this.game.events.emit(
      SettingsManager.EVENTS.SETTINGS_CHANGED,
      this.currentSettings,
      oldSettings
    );

    this.game.events.emit(
      SettingsManager.EVENTS.UI_SETTINGS_CHANGED,
      this.currentSettings,
      oldSettings
    );
  }

  private applySettings(): void {
    // Aplica volume master
    if (this.game.sound) {
      this.game.sound.volume =
        this.currentSettings.masterVolume / 100;
    }

    // Aplica tela cheia
    const scale = this.game.scale;
    if (
      scale.isFullscreen !== this.currentSettings.fullscreen
    ) {
      if (this.currentSettings.fullscreen) {
        scale.startFullscreen();
      } else {
        scale.stopFullscreen();
      }
    }

    // Aplica escala da UI
    this.uiScaleMultiplier = this.currentSettings.uiScale;

    // Aplica tamanho da fonte (será usado pelo TextManager)
    this.game.events.emit(
      SettingsManager.EVENTS.FONT_SIZE_CHANGED,
      this.getFontSizeLevel(),
      this.currentSettings.fontSize
    );

    // Aplica volumes específicos
    this.game.events.emit(
      SettingsManager.EVENTS.VOLUME_CHANGED,
      {
        music: this.currentSettings.musicVolume / 100,
        sfx: this.currentSettings.sfxVolume / 100,
      }
    );
  }

  // Métodos auxiliares para tamanho da fonte
  public getFontSizeLevel(): "small" | "normal" | "large" {
    const size = this.currentSettings.fontSize;
    if (size <= 14) return "small";
    if (size >= 20) return "large";
    return "normal";
  }

  public getFontSize(): number {
    return this.currentSettings.fontSize;
  }

  public getUIScale(): number {
    return this.uiScaleMultiplier;
  }

  public getMusicVolume(): number {
    return (
      (this.currentSettings.masterVolume / 100) *
      (this.currentSettings.musicVolume / 100)
    );
  }

  public getSFXVolume(): number {
    return (
      (this.currentSettings.masterVolume / 100) *
      (this.currentSettings.sfxVolume / 100)
    );
  }

  private setupEvents(): void {
    // Pode adicionar listeners para eventos específicos aqui
  }
}
