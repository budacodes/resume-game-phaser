import Phaser from "phaser";

export interface Quest {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  hidden?: boolean; // Se true, a missão só aparece no menu após ser descoberta
}

export class QuestManager {
  private static instance: QuestManager;
  private game: Phaser.Game;

  // Lista mestre de missões
  // @todo: definir missões com nomes e dicas melhores
  private quests: Quest[] = [
    {
      id: "buda",
      title: "O CAMINHO DA ILUMINAÇÃO",
      description:
        "Encontre o Buda e descubra suas skills no quadro.",
      isCompleted: false,
    },
    {
      id: "wish",
      title: "FAÇA UM DESEJO",
      description:
        "Encontre a fonte e jogue uma moeda para a sorte.",
      isCompleted: false,
    },
    {
      id: "secret_easter_egg",
      title: "???",
      description: "Você descobriu um segredo escondido!",
      isCompleted: false,
      hidden: true,
    },
  ];

  public static readonly EVENTS = {
    QUEST_UPDATED: "quest_updated",
    QUEST_COMPLETED: "quest_completed",
  };

  private constructor(game: Phaser.Game) {
    this.game = game;
    this.loadProgress();
  }

  public static getInstance(
    game?: Phaser.Game
  ): QuestManager {
    if (!QuestManager.instance && game) {
      QuestManager.instance = new QuestManager(game);
    }
    return QuestManager.instance;
  }

  // Retorna apenas as quests que não estão escondidas (ou que já foram completas)
  public getAllQuests(): Quest[] {
    return this.quests.filter(
      (q) => !q.hidden || q.isCompleted
    );
  }

  public completeQuest(id: string): void {
    const quest = this.quests.find((q) => q.id === id);
    if (quest && !quest.isCompleted) {
      quest.isCompleted = true;
      this.saveProgress();

      // Notifica o jogo (para sons, partículas ou atualizar o menu aberto)
      this.game.events.emit(
        QuestManager.EVENTS.QUEST_COMPLETED,
        quest
      );
      this.game.events.emit(
        QuestManager.EVENTS.QUEST_UPDATED
      );
    }
  }

  private saveProgress(): void {
    const completedIds = this.quests
      .filter((q) => q.isCompleted)
      .map((q) => q.id);
    localStorage.setItem(
      "game_quests_progress",
      JSON.stringify(completedIds)
    );
  }

  private loadProgress(): void {
    const saved = localStorage.getItem(
      "game_quests_progress"
    );
    if (saved) {
      const completedIds: string[] = JSON.parse(saved);
      this.quests.forEach((q) => {
        if (completedIds.includes(q.id))
          q.isCompleted = true;
      });
    }
  }
}
