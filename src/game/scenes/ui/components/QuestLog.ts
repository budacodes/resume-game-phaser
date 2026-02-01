import Phaser from "phaser";
import { CursorManager } from "../../../../managers/CursorManager";
import { QuestManager } from "../../../../managers/QuestManager";
import { COLORS } from "../Utils";

// Interface para estruturar as missões
interface Quest {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export class QuestLog {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private opened = false;

  public isVisible = false;

  private readonly panelWidth = 520;
  private readonly panelPadding = 32;
  private readonly rowHeight = 70; // Maior que o settings para caber a descrição

  private cursorManager: CursorManager;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cursorManager = CursorManager.getInstance();

    this.container = scene.add.container(0, 0);
    this.container.setDepth(101); // Um pouco acima do settings se necessário
    this.container.setVisible(false);
    this.container.setScrollFactor(0);

    this.create();
  }

  public open(): void {
    if (this.isVisible) return;

    this.isVisible = true;

    // 1. Atualiza dados antes de mostrar
    // this.updateLocalSettingsFromManager();

    // 2. Reconstrói UI com valores atualizados
    this.container.removeAll(true);
    this.create();

    // 3. Cursor sempre correto
    const cursor = CursorManager.getInstance();
    cursor.setScene(this.scene);
    cursor.showCursor();

    // 4. Mostra container
    this.container.setVisible(true);
  }

  public close(): void {
    if (!this.isVisible) return;

    this.isVisible = false;

    // Opcional: limpar foco / estados internos aqui

    this.container.setVisible(false);
  }

  public isOpen(): boolean {
    return this.opened;
  }

  public toggle(): void {
    this.isVisible ? this.close() : this.open();
  }

  private create(): void {
    const { width, height } = this.scene.scale;
    this.container.setPosition(width / 2, height / 2);

    // Reutilizando o sistema de escala do settings
    // (Ajuste conforme o valor global de escala do seu jogo)
    const scaleToApply = 1.0;
    this.container.setScale(scaleToApply);

    // Overlay Escuro
    const overlay = this.scene.add
      .rectangle(
        0,
        0,
        width / scaleToApply,
        height / scaleToApply,
        0x000000,
        0.7,
      )
      .setOrigin(0.5)
      .setInteractive();
    overlay.on("pointerdown", () => this.toggle());
    this.container.add(overlay);

    // Painel de Fundo
    const background = this.scene.add.rectangle(
      0,
      0,
      this.panelWidth,
      520,
      0x0b0b0b,
      0.95,
    );
    background.setStrokeStyle(2, 0xffffff, 1);
    background.setOrigin(0.5).setInteractive();
    this.container.add(background);

    // Título Estilizado
    const title = this.scene.add
      .text(0, -220, "DIÁRIO DE MISSÕES", {
        fontFamily: "'VT323'",
        fontSize: "32px",
        color: `#${COLORS.gold}`, // Cor dourada para quests
      })
      .setOrigin(0.5);
    this.container.add(title);

    const questManager = QuestManager.getInstance(
      this.scene.game,
    );
    const currentQuests = questManager.getAllQuests();

    let cursorY = -140;
    currentQuests.forEach((quest) => {
      this.addQuestRow(quest, cursorY);
      cursorY += this.rowHeight;
    });

    // Botão Fechar (X) - Reutilizando sua lógica
    const closeButton = this.scene.add
      .sprite(this.panelWidth / 2 - 32, -224, "close")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false })
      .setScale(2);

    closeButton.on("pointerover", () => {
      this.cursorManager.setState("hover");
      closeButton.setTintFill(+`0x${COLORS.red}`);
    });
    closeButton.on("pointerout", () => {
      this.cursorManager.setState("default");
      closeButton.clearTint();
    });
    closeButton.on("pointerdown", () => this.toggle());
    this.container.add(closeButton);
  }

  private addQuestRow(quest: Quest, y: number): void {
    const startX = -this.panelWidth / 2 + this.panelPadding;
    const elements: Phaser.GameObjects.GameObject[] = [];

    // Status Icon (Checkbox)
    // Se tiver um asset de checkbox, use sprite. Se não, use retângulo/texto.
    const statusBox = this.scene.add
      .rectangle(startX + 10, y, 24, 24, 0x333333)
      .setStrokeStyle(
        2,
        quest.isCompleted ? +`0x${COLORS.green}` : 0x999999,
      );
    elements.push(statusBox);

    if (quest.isCompleted) {
      const check = this.scene.add
        .text(startX + 10, y - 6, "x", {
          fontSize: "42px",
          fontFamily: "'VT323'",
          color: `#${COLORS.green}`,
        })
        .setOrigin(0.5);
      elements.push(check);

      const textWidth = quest.title.length * 8;
      const strikeLine = this.scene.add
        .rectangle(
          startX + 40,
          y - 12,
          textWidth,
          2,
          0x888888,
        )
        .setOrigin(0, 0.5);

      elements.push(strikeLine);
    }

    // Título da Quest
    const title = this.scene.add
      .text(startX + 40, y - 12, quest.title, {
        fontFamily: "'VT323'",
        fontSize: "20px",
        color: quest.isCompleted ? "#888888" : "#ffffff",
      })
      .setOrigin(0, 0.5);
    elements.push(title);

    // Descrição
    const desc = this.scene.add
      .text(startX + 40, y + 10, quest.description, {
        fontFamily: "'VT323'",
        fontSize: "14px",
        color: quest.isCompleted ? "#555555" : "#aaaaaa",
        wordWrap: { width: this.panelWidth - 100 },
      })
      .setOrigin(0, 0.5);
    elements.push(desc);

    // Linha divisória sutil
    const separator = this.scene.add.rectangle(
      0,
      y + 30,
      this.panelWidth - 40,
      1,
      0xffffff,
      0.1,
    );
    elements.push(separator);

    this.container.add(elements);
  }
}
