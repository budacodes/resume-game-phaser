import { QuestQueryPort } from "../../application/ports/QuestQueryPort";
import { Quest, QuestManager } from "../../managers/QuestManager";

export class QuestManagerQuery implements QuestQueryPort {
  constructor(private readonly manager: QuestManager) {}

  getAllQuests(): Quest[] {
    return this.manager.getAllQuests();
  }
}
