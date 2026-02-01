import Phaser from "phaser";
import { InventoryItem } from "../../../../config/models/InventoryItem";
import { InventoryItemSprite } from "../../../../entities/ItemSprite";
import { DropItemConfirmationUseCase } from "../../../../application/usecases/DropItemConfirmationUseCase";
import { InventoryQueryPort } from "../../../../application/ports/InventoryQueryPort";
import { UseItemUseCase } from "../../../../application/usecases/UseItemUseCase";
import {
  InventoryComposition,
  InventoryCompositionResult,
} from "../../../../composition/InventoryComposition";
import { CursorPort } from "../../../../application/ports/CursorPort";
import { InventoryDetailsPanel } from "./InventoryDetailsPanel";
import { COLORS } from "../Utils";

export class Inventory {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private opened = false;

  private cursorManager: CursorPort;
  private dropItemConfirmationUseCase: DropItemConfirmationUseCase;
  private inventoryQuery: InventoryQueryPort;
  private useItemUseCase: UseItemUseCase;
  private detailsPanel: InventoryDetailsPanel;

  private selectedSlot?: Phaser.GameObjects.Rectangle;
  private slotMap = new Map<
    string,
    Phaser.GameObjects.Rectangle
  >();

  public isVisible = false;

  // Painel
  private readonly panelWidth = 696;
  private readonly panelHeight = 456;

  // Grid
  private readonly columns = 5;
  private readonly rows = 4;
  private readonly slotSize = 56;
  private readonly slotPadding = 10;
  private readonly capacity = this.columns * this.rows;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const composition = this.composeDependencies();
    this.cursorManager = composition.cursor;
    this.dropItemConfirmationUseCase =
      composition.dropItemConfirmationUseCase;
    this.inventoryQuery = composition.inventoryQuery;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(101);
    this.container.setVisible(false);
    this.container.setScrollFactor(0);

    this.useItemUseCase = composition.useItemUseCase;
    this.detailsPanel = new InventoryDetailsPanel({
      scene: this.scene,
      container: this.container,
      cursorManager: this.cursorManager,
      panelWidth: this.panelWidth,
      panelHeight: this.panelHeight,
      useItemUseCase: this.useItemUseCase,
      dropItemConfirmationUseCase:
        this.dropItemConfirmationUseCase,
      onRefresh: () => {
        this.toggle();
        this.toggle();
      },
    });

    this.create();
  }

  private composeDependencies(): InventoryCompositionResult {
    return new InventoryComposition().build();
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
    this.cursorManager.setScene(this.scene);
    this.cursorManager.showCursor();

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

    // Overlay
    const overlay = this.scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0.5)
      .setInteractive();

    overlay.on("pointerdown", () => this.toggle());
    this.container.add(overlay);

    // Painel principal
    const background = this.scene.add
      .rectangle(
        0,
        0,
        this.panelWidth,
        this.panelHeight,
        0x0b0b0b,
        0.95,
      )
      .setStrokeStyle(2, +`0x${COLORS.gold}`, 1)
      .setOrigin(0.5);

    this.container.add(background);

    // Título
    this.container.add(
      this.scene.add
        .text(
          -this.panelWidth / 2 + 24,
          -this.panelHeight / 2 + 20,
          "INVENTÁRIO",
          {
            fontFamily: "'VT323'",
            fontSize: "28px",
            color: `#${COLORS.gold}`,
          },
        )
        .setOrigin(0, 0),
    );

    // Capacidade
    const obtainedCount =
      this.inventoryQuery.getObtainedItems().length;

    this.container.add(
      this.scene.add
        .text(
          -this.panelWidth / 2 + 24,
          -this.panelHeight / 2 + 48,
          `Capacidade ${obtainedCount}/${this.capacity}`,
          {
            fontFamily: "'VT323'",
            fontSize: "16px",
            color: "#aaaaaa",
          },
        )
        .setOrigin(0, 0),
    );

    this.createGrid();
    this.detailsPanel.createBasePanel();

    // Seleciona primeiro item automaticamente
    const firstItem =
      this.inventoryQuery.getObtainedItems()[0];
    if (firstItem) {
      this.selectItem(firstItem);
    } else {
      this.detailsPanel.showEmpty();
    }

    // Botão fechar
    const closeButton = this.scene.add
      .sprite(
        this.panelWidth / 2 - 24,
        -this.panelHeight / 2 + 24,
        "close",
      )
      .setScale(2)
      .setInteractive();

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

  // GRID COM SLOTS VAZIOS
  private createGrid(): void {
    const items = this.inventoryQuery.getObtainedItems();

    const startX = -this.panelWidth / 2 + 32;
    const startY = -this.panelHeight / 2 + 96;

    for (let i = 0; i < this.capacity; i++) {
      const col = i % this.columns;
      const row = Math.floor(i / this.columns);

      const x =
        startX + col * (this.slotSize + this.slotPadding);
      const y =
        startY + row * (this.slotSize + this.slotPadding);

      const slot = this.scene.add
        .rectangle(
          x + this.slotSize / 2,
          y + this.slotSize / 2,
          this.slotSize,
          this.slotSize,
          0x1a1a1a,
        )
        .setStrokeStyle(1, +`0x${COLORS.gold}`, 0.3);

      const item = items[i];
      // guarda slot por item
      if (item) {
        this.slotMap.set(item.id, slot);
      }

      this.container.add(slot);

      if (!item) continue;

      const icon = new InventoryItemSprite(
        this.scene,
        x + this.slotSize / 2,
        y + this.slotSize / 2,
        item,
      )
        .setOrigin(0.5)
        .setInteractive();

      icon.show(
        x + this.slotSize / 2,
        y + this.slotSize / 2,
        2,
      );

      // const icon = new CoinFlip(
      //   this.scene,
      //   x + this.slotSize / 2,
      //   y + this.slotSize / 2,
      //   "coin_flip",
      // )
      //   .setScale(2)

      icon.on("pointerover", () => {
        this.cursorManager.setState("hover");
        slot.setStrokeStyle(2, +`0x${COLORS.gold}`, 1);
      });

      icon.on("pointerout", () => {
        this.cursorManager.setState("default");
        slot.setStrokeStyle(1, +`0x${COLORS.gold}`, 0.3);
      });

      icon.on("pointerdown", () => {
        this.selectItem(item);
      });

      this.container.add(icon);
    }
  }

  private highlightSlot(itemId: string): void {
    // Remove highlight anterior
    if (this.selectedSlot) {
      this.selectedSlot
        .setFillStyle(0x1a1a1a)
        .setStrokeStyle(1, +`0x${COLORS.gold}`, 0.3);
    }

    const slot = this.slotMap.get(itemId);
    if (!slot) return;

    // Aplica highlight
    slot
      .setFillStyle(+`0x${COLORS.gold}`, 0.5)
      .setStrokeStyle(2, +`0x${COLORS.gold}`, 1);

    this.selectedSlot = slot;
  }

  private selectItem(item: InventoryItem): void {
    this.highlightSlot(item.id);
    this.detailsPanel.showItem(item);
  }
}
