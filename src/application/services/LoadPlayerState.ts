import { PlayerGender } from "../../config/types/IntroTypes";
import { InventoryManager } from "../../managers/InventoryManager";
import { PlayerIdentityManager } from "../../managers/PlayerIdentityManager";

export class LoadPlayerState {
  static execute() {
    const idNumber = localStorage.getItem("player_id");
    const name = localStorage.getItem("player_name");
    const gender = localStorage.getItem("player_gender");
    const role = localStorage.getItem("player_career");
    const access = localStorage.getItem("player_access");

    // 👉 se não tem dados, não faz nada
    if (!name) return;

    // 🔥 recria o crachá
    PlayerIdentityManager.getInstance().setIdCard({
      idNumber,
      name,
      gender: <PlayerGender>gender,
      faceTexture: `${gender}-face`,
      role,
      accessLevel: access,
    });

    // 🔥 garante item no inventário
    InventoryManager.getInstance().obtainItem("keycard");
    InventoryManager.getInstance().obtainItem(
      "survival-guide",
    );
  }
}
