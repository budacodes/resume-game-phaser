import Phaser from "phaser";
import { CursorPort } from "../application/ports/CursorPort";
import { SettingsPort } from "../application/ports/SettingsPort";
import { QuestQueryPort } from "../application/ports/QuestQueryPort";
import { CursorManager } from "../managers/CursorManager";
import { CursorManagerAdapter } from "../infrastructure/adapters/CursorManagerAdapter";
import { SettingsManager } from "../managers/SettingsManager";
import { SettingsManagerAdapter } from "../infrastructure/adapters/SettingsManagerAdapter";
import { QuestManager } from "../managers/QuestManager";
import { QuestManagerQuery } from "../infrastructure/adapters/QuestManagerQuery";

export interface UISceneCompositionResult {
  cursorPort: CursorPort;
  settingsPort: SettingsPort;
  questQuery: QuestQueryPort;
}

export class UISceneComposition {
  constructor(private readonly scene: Phaser.Scene) {}

  build(): UISceneCompositionResult {
    const cursorPort = new CursorManagerAdapter(
      CursorManager.getInstance(),
    );
    const settingsPort = new SettingsManagerAdapter(
      SettingsManager.getInstance(this.scene.game),
    );
    const questQuery = new QuestManagerQuery(
      QuestManager.getInstance(this.scene.game),
    );

    return { cursorPort, settingsPort, questQuery };
  }
}
