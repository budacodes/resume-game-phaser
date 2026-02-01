import Phaser from "phaser";
import { ShowDialogUseCase } from "../application/usecases/ShowDialogUseCase";
import { PhaserDialogPresenter } from "../infrastructure/adapters/PhaserDialogPresenter";
import { PhaserDialogEventAdapter } from "../infrastructure/adapters/PhaserDialogEventAdapter";
import { PhaserInteractionInput } from "../infrastructure/adapters/PhaserInteractionInput";
import { PhaserTimeScheduler } from "../infrastructure/adapters/PhaserTimeScheduler";
import { MapPort } from "../application/ports/MapPort";
import { MapManager } from "../managers/MapManager";
import { PhaserMapAdapter } from "../infrastructure/adapters/PhaserMapAdapter";
import { WarpUseCase } from "../application/usecases/WarpUseCase";
import { PhaserSceneTransition } from "../infrastructure/adapters/PhaserSceneTransition";

export interface InteriorSceneCompositionResult {
  mapPort: MapPort;
  interactionInput: PhaserInteractionInput;
  dialogEventAdapter: PhaserDialogEventAdapter;
  timeScheduler: PhaserTimeScheduler;
  showDialogUseCase: ShowDialogUseCase;
  warpUseCase: WarpUseCase;
}

export interface DialogEventHandlers {
  onStarted: () => void;
  onFinished: () => void;
}

export class InteriorSceneComposition {
  constructor(private readonly scene: Phaser.Scene) {}

  build(
    dialogEventHandlers: DialogEventHandlers,
  ): InteriorSceneCompositionResult {
    const dialogPresenter = new PhaserDialogPresenter(
      this.scene,
    );
    const mapManager = new MapManager(this.scene);
    const mapPort = new PhaserMapAdapter(mapManager);

    return {
      mapPort,
      interactionInput: new PhaserInteractionInput(
        this.scene,
      ),
      dialogEventAdapter: new PhaserDialogEventAdapter(
        this.scene,
        dialogEventHandlers,
      ),
      timeScheduler: new PhaserTimeScheduler(this.scene),
      showDialogUseCase: new ShowDialogUseCase(
        dialogPresenter,
      ),
      warpUseCase: new WarpUseCase(
        new PhaserSceneTransition(this.scene),
      ),
    };
  }
}
