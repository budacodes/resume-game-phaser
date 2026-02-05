import Phaser from "phaser";
import { CursorPort } from "../application/ports/CursorPort";
import { SettingsPort } from "../application/ports/SettingsPort";
import { CollectItemUseCase } from "../application/usecases/CollectItemUseCase";
import { SettingsMenu } from "../game/scenes/ui/components/SettingsMenu";
import { CursorManagerAdapter } from "../infrastructure/adapters/CursorManagerAdapter";
import { InventoryManagerRepository } from "../infrastructure/adapters/InventoryManagerRepository";
import { PhaserDialogPresenter } from "../infrastructure/adapters/PhaserDialogPresenter";
import { SettingsManagerAdapter } from "../infrastructure/adapters/SettingsManagerAdapter";
import { AudioManager } from "../managers/AudioManager";
import { CursorManager } from "../managers/CursorManager";
import { InventoryManager } from "../managers/InventoryManager";
import { SettingsManager } from "../managers/SettingsManager";
import { TextManager } from "../managers/TextManager";

export interface IntroSceneCompositionResult {
  audioManager: AudioManager;
  textManager: TextManager;
  settingsMenu: SettingsMenu;
  settingsPort: SettingsPort;
  cursorPort: CursorPort;
  collectItemUseCase: CollectItemUseCase;
  dialogPresenter: PhaserDialogPresenter;
}

export class IntroSceneComposition {
  constructor(private readonly scene: Phaser.Scene) {}

  build(): IntroSceneCompositionResult {
    const inventoryManager = InventoryManager.getInstance();
    const inventoryRepository =
      new InventoryManagerRepository(inventoryManager);
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
    const dialogPresenter = new PhaserDialogPresenter(
      this.scene,
    );

    return {
      collectItemUseCase: new CollectItemUseCase(
        inventoryRepository,
        dialogPresenter,
      ),
      dialogPresenter,
      audioManager,
      textManager,
      settingsMenu,
      settingsPort,
      cursorPort,
    };
  }
}
