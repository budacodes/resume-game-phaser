import Phaser from "phaser";
import { AudioManager } from "../managers/AudioManager";
import { TextManager } from "../managers/TextManager";
import { SettingsManager } from "../managers/SettingsManager";
import { SettingsPort } from "../application/ports/SettingsPort";
import { SettingsManagerAdapter } from "../infrastructure/adapters/SettingsManagerAdapter";
import { CursorPort } from "../application/ports/CursorPort";
import { CursorManager } from "../managers/CursorManager";
import { CursorManagerAdapter } from "../infrastructure/adapters/CursorManagerAdapter";
import { SettingsMenu } from "../game/scenes/ui/components/SettingsMenu";

export interface IntroSceneCompositionResult {
  audioManager: AudioManager;
  textManager: TextManager;
  settingsMenu: SettingsMenu;
  settingsPort: SettingsPort;
  cursorPort: CursorPort;
}

export class IntroSceneComposition {
  constructor(private readonly scene: Phaser.Scene) {}

  build(): IntroSceneCompositionResult {
    const settingsManager = SettingsManager.getInstance(
      this.scene.game,
    );
    const settingsPort = new SettingsManagerAdapter(
      settingsManager,
    );
    const cursorPort = new CursorManagerAdapter(
      CursorManager.getInstance(),
    );
    const audioManager = new AudioManager(this.scene);
    const textManager = new TextManager(this.scene);
    const settingsMenu = new SettingsMenu(
      this.scene,
      cursorPort,
      settingsPort,
    );

    return {
      audioManager,
      textManager,
      settingsMenu,
      settingsPort,
      cursorPort,
    };
  }
}
