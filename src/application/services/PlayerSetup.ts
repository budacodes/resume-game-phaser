import { PlayerIdCard } from "../../config/models/PlayerIdCard";
import { InventoryManager } from "../../managers/InventoryManager";
import { PlayerIdentityManager } from "../../managers/PlayerIdentityManager";

export class PlayerSetup {
  static createPlayer(data: PlayerIdCard) {
    PlayerIdentityManager.getInstance().setIdCard(data);
    InventoryManager.getInstance().obtainItem("keycard");
  }
}
