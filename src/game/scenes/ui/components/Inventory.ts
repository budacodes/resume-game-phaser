import Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { InventoryItem } from "../../../../config/models/InventoryItem";
import { InventoryItemSprite } from "../../../../entities/ItemSprite";
import { CursorManager } from "../../../../managers/CursorManager";
import { InventoryManager } from "../../../../managers/InventoryManager";
import { COLORS } from "../Utils";

export class Inventory {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private opened = false;

  private cursorManager: CursorManager;
  private inventoryManager: InventoryManager;

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

  private selectedItem: InventoryItem | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.cursorManager = CursorManager.getInstance();
    this.inventoryManager = InventoryManager.getInstance();

    this.container = scene.add.container(0, 0);
    this.container.setDepth(101);
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
      this.inventoryManager.getObtainedItems().length;

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
    this.createDetailsPanel();

    // Seleciona primeiro item automaticamente
    const firstItem =
      this.inventoryManager.getObtainedItems()[0];
    if (firstItem) {
      this.selectItem(firstItem);
    } else {
      this.showEmptyDetails();
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
    const items = this.inventoryManager.getObtainedItems();

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

  // PAINEL DE DETALHES
  private createDetailsPanel(): void {
    const panelX = this.panelWidth / 2 - 200;

    const panel = this.scene.add
      .rectangle(panelX, 20, 360, 400, 0x111111, 0.95)
      .setStrokeStyle(1, +`0x${COLORS.gold}`, 0.6);

    panel.name = "details";
    this.container.add(panel);
  }

  private selectItem(item: InventoryItem): void {
    this.selectedItem = item;
    this.highlightSlot(item.id);
    this.clearDetails();

    const panelX = this.panelWidth / 2 - 150;

    // Ícone grande
    // const icon = new CoinFlip(
    //   this.scene,
    //   panelX,
    //   -140,
    //   "coin_flip",
    // ).setScale(4);

    const icon = new InventoryItemSprite(
      this.scene,
      panelX,
      -140,
      item,
    )
      .setOrigin(0.5)
      .setInteractive();

    icon.show(panelX, -140, 4);

    icon.name = "details";

    // Nome
    const name = new BBCodeText(
      this.scene,
      panelX,
      -48,
      item.name,
      {
        fontFamily: "'VT323'",
        fontSize: "36px",
        color: `#${COLORS.gold}`,
      },
    ).setOrigin(0.5);
    name.name = "details";

    // Descrição
    const desc = new BBCodeText(
      this.scene,
      panelX - 150,
      0,
      item.description,
      {
        fontFamily: "'VT323'",
        fontSize: "24px",
        color: "#cccccc",
        wrap: { width: 300 },
      },
    ).setOrigin(0, 0);
    desc.name = "details";

    const detailBox = this.scene.add.rectangle(
      panelX,
      0,
      340,
      this.panelHeight,
      0x222222,
      0.3,
    );
    detailBox.name = "details";
    this.container.add(detailBox);

    // Botões
    if (item.canBeUsed) {
      this.createActionButton(
        panelX - 90,
        160,
        "USAR",
        `${COLORS.green}`,
        () => {
          console.log("Usar item:", item.id);
        },
      );
    }

    if (item.canBeDropped) {
      this.createActionButton(
        panelX + 70,
        160,
        "DESCARTAR",
        `${COLORS.red}`,
        () => {
          this.confirmDrop(item);
        },
      );
    }

    this.container.add([icon, name, desc]);
  }

  private showEmptyDetails(): void {
    this.clearDetails();

    const panelX = this.panelWidth / 2 - 200;

    const msg = this.scene.add
      .text(panelX, 0, "Inventário vazio", {
        fontFamily: "'VT323'",
        fontSize: "18px",
        color: "#777777",
      })
      .setOrigin(0.5);

    msg.name = "details";
    this.container.add(msg);
  }

  private clearDetails(): void {
    this.container
      .getAll()
      .filter((o) => o.name === "details")
      .forEach((o) => o.destroy());
  }

  private createActionButton(
    x: number,
    y: number,
    label: string,
    color: string,
    onClick: () => void,
  ): void {
    console.log(color);

    const btn = this.scene.add
      .rectangle(x, y, 120, 32, 0x222222)
      .setStrokeStyle(1, +`0x${color}`, 1)
      .setInteractive();

    const text = this.scene.add
      .text(x, y, label, {
        fontFamily: "'VT323'",
        fontSize: "20px",
        color: `#${color}`,
      })
      .setOrigin(0.5);

    btn.name = text.name = "details";

    btn.on("pointerover", () => {
      this.cursorManager.setState("hover");
      btn.setFillStyle(0x333333);
    });

    btn.on("pointerout", () => {
      this.cursorManager.setState("default");
      btn.setFillStyle(0x222222);
    });

    btn.on("pointerdown", onClick);

    this.container.add([btn, text]);
  }

  private confirmDrop(item: InventoryItem): void {
    const panelX = this.panelWidth / 2 - 200;

    this.clearDetails();

    const text = this.scene.add
      .text(panelX, 0, "Descartar este item?", {
        fontFamily: "'VT323'",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    text.name = "details";
    this.container.add(text);

    this.createActionButton(
      panelX - 70,
      60,
      "SIM",
      `${COLORS.red}`,
      () => {
        this.inventoryManager.removeItem(item.id);
        this.toggle();
        this.toggle();
      },
    );

    this.createActionButton(
      panelX + 70,
      60,
      "NÃO",
      `${COLORS.blue}`,
      () => {
        this.selectItem(item);
      },
    );
  }
}
