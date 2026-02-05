import { DialogPort } from "../ports/DialogPort";
import { FlagRepository } from "../ports/FlagRepository";
import { InventoryRepository } from "../ports/InventoryRepository";

export class InsanosFlagUseCase {
  private readonly flagId = "insanos_flag_seen";

  constructor(
    private readonly flags: FlagRepository,
    private readonly inventory: InventoryRepository,
    private readonly dialog: DialogPort,
  ) {}

  start(): boolean {
    if (this.flags.hasSeen(this.flagId)) return false;
    this.flags.markSeen(this.flagId);
    return true;
  }

  showIntroDialog(): void {
    this.dialog.show({
      text: "Algumas bandeiras não se explicam...",
      mode: "read",
    });
  }

  complete(): void {
    this.inventory.obtainItem("issi_pin");
    this.dialog.hide();
  }
}
