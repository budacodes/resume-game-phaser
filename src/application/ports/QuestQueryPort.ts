import { Quest } from "../../managers/QuestManager";

export interface QuestQueryPort {
  getAllQuests(): Quest[];
}
