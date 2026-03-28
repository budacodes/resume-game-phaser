import { PlayerIdCard } from "../config/models/PlayerIdCard";

export class PlayerIdentityManager {
  private static instance: PlayerIdentityManager;
  private idCard?: PlayerIdCard;

  static getInstance(): PlayerIdentityManager {
    if (!this.instance) {
      this.instance = new PlayerIdentityManager();
    }
    return this.instance;
  }

  setIdCard(data: PlayerIdCard) {
    this.idCard = data;
  }

  getIdCard(): PlayerIdCard | undefined {
    return this.idCard;
  }
}
