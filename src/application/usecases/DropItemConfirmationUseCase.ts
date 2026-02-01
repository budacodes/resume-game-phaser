import { DropItemUseCase } from "./DropItemUseCase";

export interface DropConfirmationViewModel {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

export class DropItemConfirmationUseCase {
  constructor(private readonly dropItem: DropItemUseCase) {}

  getViewModel(): DropConfirmationViewModel {
    return {
      message: "Descartar este item?",
      confirmLabel: "SIM",
      cancelLabel: "NÃO",
    };
  }

  confirm(itemId: string): void {
    this.dropItem.execute(itemId);
  }
}
