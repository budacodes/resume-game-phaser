import Phaser from "phaser";
import { CollectItemUseCase } from "../application/usecases/CollectItemUseCase";
import { FountainInteractionUseCase } from "../application/usecases/FountainInteractionUseCase";
import { InsanosFlagUseCase } from "../application/usecases/InsanosFlagUseCase";
import { ShowDialogUseCase } from "../application/usecases/ShowDialogUseCase";
import { WarpUseCase } from "../application/usecases/WarpUseCase";
import { AudioPort } from "../application/ports/AudioPort";
import { AudioManager } from "../managers/AudioManager";
import { AudioManagerAdapter } from "../infrastructure/adapters/AudioManagerAdapter";
import { InventoryManager } from "../managers/InventoryManager";
import { InventoryManagerRepository } from "../infrastructure/adapters/InventoryManagerRepository";
import { PhaserDialogPresenter } from "../infrastructure/adapters/PhaserDialogPresenter";
import { PhaserRegistryFlagRepository } from "../infrastructure/adapters/PhaserRegistryFlagRepository";
import { PhaserSceneTransition } from "../infrastructure/adapters/PhaserSceneTransition";
import { MapManager } from "../managers/MapManager";
import { PhaserMapAdapter } from "../infrastructure/adapters/PhaserMapAdapter";
import { MapPort } from "../application/ports/MapPort";
import { PhaserInteractionInput } from "../infrastructure/adapters/PhaserInteractionInput";
import { PhaserDialogEventAdapter } from "../infrastructure/adapters/PhaserDialogEventAdapter";
import { PhaserTimeScheduler } from "../infrastructure/adapters/PhaserTimeScheduler";
import { CursorPort } from "../application/ports/CursorPort";
import { CursorManager } from "../managers/CursorManager";
import { CursorManagerAdapter } from "../infrastructure/adapters/CursorManagerAdapter";

export interface MainSceneCompositionResult {
  audio: AudioPort;
  mapPort: MapPort;
  cursor: CursorPort;
  collectItemUseCase: CollectItemUseCase;
  fountainInteractionUseCase: FountainInteractionUseCase;
  insanosFlagUseCase: InsanosFlagUseCase;
  showDialogUseCase: ShowDialogUseCase;
  warpUseCase: WarpUseCase;
  interactionInput: PhaserInteractionInput;
  dialogEventAdapter: PhaserDialogEventAdapter;
  timeScheduler: PhaserTimeScheduler;
  dialogPresenter: PhaserDialogPresenter;
}

export interface DialogEventHandlers {
  onStarted: () => void;
  onFinished: () => void;
}

export class MainSceneComposition {
  constructor(private readonly scene: Phaser.Scene) {}

  build(
    dialogEventHandlers: DialogEventHandlers,
  ): MainSceneCompositionResult {
    const inventoryManager = InventoryManager.getInstance();
    const inventoryRepository = new InventoryManagerRepository(
      inventoryManager,
    );
    const dialogPresenter = new PhaserDialogPresenter(
      this.scene,
    );
    const audio = new AudioManagerAdapter(
      AudioManager.getInstance(this.scene),
    );
    const mapManager = new MapManager(this.scene);
    const mapPort = new PhaserMapAdapter(mapManager);
    const cursor = new CursorManagerAdapter(
      CursorManager.getInstance(),
    );

    return {
      audio,
      mapPort,
      cursor,
      dialogPresenter,
      collectItemUseCase: new CollectItemUseCase(
        inventoryRepository,
        dialogPresenter,
      ),
      fountainInteractionUseCase:
        new FountainInteractionUseCase(
          inventoryRepository,
          dialogPresenter,
        ),
      insanosFlagUseCase: new InsanosFlagUseCase(
        new PhaserRegistryFlagRepository(this.scene),
        inventoryRepository,
        dialogPresenter,
      ),
      showDialogUseCase: new ShowDialogUseCase(
        dialogPresenter,
      ),
      warpUseCase: new WarpUseCase(
        new PhaserSceneTransition(this.scene),
      ),
      interactionInput: new PhaserInteractionInput(
        this.scene,
      ),
      dialogEventAdapter: new PhaserDialogEventAdapter(
        this.scene,
        dialogEventHandlers,
      ),
      timeScheduler: new PhaserTimeScheduler(this.scene),
    };
  }
}
