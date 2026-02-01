import { DropItemConfirmationUseCase } from "../application/usecases/DropItemConfirmationUseCase";
import { DropItemUseCase } from "../application/usecases/DropItemUseCase";
import { UseItemUseCase } from "../application/usecases/UseItemUseCase";
import { InventoryQueryPort } from "../application/ports/InventoryQueryPort";
import { InventoryManager } from "../managers/InventoryManager";
import { InventoryManagerRepository } from "../infrastructure/adapters/InventoryManagerRepository";
import { InventoryManagerQuery } from "../infrastructure/adapters/InventoryManagerQuery";
import { ConsoleItemUseHandler } from "../infrastructure/adapters/ConsoleItemUseHandler";
import { CursorPort } from "../application/ports/CursorPort";
import { CursorManager } from "../managers/CursorManager";
import { CursorManagerAdapter } from "../infrastructure/adapters/CursorManagerAdapter";

export interface InventoryCompositionResult {
  inventoryQuery: InventoryQueryPort;
  dropItemUseCase: DropItemUseCase;
  dropItemConfirmationUseCase: DropItemConfirmationUseCase;
  useItemUseCase: UseItemUseCase;
  cursor: CursorPort;
}

export class InventoryComposition {
  build(): InventoryCompositionResult {
    const inventoryManager = InventoryManager.getInstance();
    const inventoryRepository = new InventoryManagerRepository(
      inventoryManager,
    );
    const inventoryQuery = new InventoryManagerQuery(
      inventoryManager,
    );
    const dropItemUseCase = new DropItemUseCase(
      inventoryRepository,
    );
    const dropItemConfirmationUseCase =
      new DropItemConfirmationUseCase(dropItemUseCase);
    const useItemUseCase = new UseItemUseCase(
      new ConsoleItemUseHandler(),
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
