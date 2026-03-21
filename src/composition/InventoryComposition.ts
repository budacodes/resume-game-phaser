import { AudioPort } from '../application/ports/AudioPort';
import { CursorPort } from "../application/ports/CursorPort";
import { DialogPort } from "../application/ports/DialogPort";
import { InventoryQueryPort } from "../application/ports/InventoryQueryPort";
import { DropItemConfirmationUseCase } from "../application/usecases/DropItemConfirmationUseCase";
import { DropItemUseCase } from "../application/usecases/DropItemUseCase";
import { UseItemUseCase } from "../application/usecases/UseItemUseCase";
import { CursorManagerAdapter } from "../infrastructure/adapters/CursorManagerAdapter";
import { InventoryManagerQuery } from "../infrastructure/adapters/InventoryManagerQuery";
import { InventoryManagerRepository } from "../infrastructure/adapters/InventoryManagerRepository";
import { CursorManager } from "../managers/CursorManager";
import { InventoryManager } from "../managers/InventoryManager";

export interface InventoryCompositionResult {
  inventoryQuery: InventoryQueryPort;
  dropItemUseCase: DropItemUseCase;
  dropItemConfirmationUseCase: DropItemConfirmationUseCase;
  useItemUseCase: UseItemUseCase;
  cursor: CursorPort;
}

export class InventoryComposition {
  build(dialog: DialogPort, audio: AudioPort): InventoryCompositionResult {
    const inventoryManager = InventoryManager.getInstance();
    const inventoryRepository =
      new InventoryManagerRepository(inventoryManager);
    const inventoryQuery = new InventoryManagerQuery(
      inventoryManager,
    );
    const dropItemUseCase = new DropItemUseCase(
      inventoryRepository,
    );
    const dropItemConfirmationUseCase =
      new DropItemConfirmationUseCase(dropItemUseCase);
    const useItemUseCase = new UseItemUseCase(
      inventoryRepository,
      dialog,
      audio,
    );
    const cursor = new CursorManagerAdapter(
      CursorManager.getInstance(),
    );

    return {
      inventoryQuery,
      dropItemUseCase,
      dropItemConfirmationUseCase,
      useItemUseCase,
      cursor,
    };
  }
}
