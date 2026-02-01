import Phaser from "phaser";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext";
import { InventoryItem } from "../../../../config/models/InventoryItem";
import { InventoryItemSprite } from "../../../../entities/ItemSprite";
import { DropItemConfirmationUseCase } from "../../../../application/usecases/DropItemConfirmationUseCase";
import { UseItemUseCase } from "../../../../application/usecases/UseItemUseCase";
import { CursorPort } from "../../../../application/ports/CursorPort";
import { COLORS } from "../Utils";

interface InventoryDetailsPanelParams {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  cursorManager: CursorPort;
  panelWidth: number;
  panelHeight: number;
  useItemUseCase: UseItemUseCase;
  dropItemConfirmationUseCase: DropItemConfirmationUseCase;
  onRefresh: () => void;
}

export class InventoryDetailsPanel {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly cursorManager: CursorPort;
  private readonly panelWidth: number;
  private readonly panelHeight: number;
  private readonly useItemUseCase: UseItemUseCase;
  private readonly dropItemConfirmationUseCase: DropItemConfirmationUseCase;
  private readonly onRefresh: () => void;

  constructor(params: InventoryDetailsPanelParams) {
    this.scene = params.scene;
    this.container = params.container;
    this.cursorManager = params.cursorManager;
    this.panelWidth = params.panelWidth;
    this.panelHeight = params.panelHeight;
    this.useItemUseCase = params.useItemUseCase;
    this.dropItemConfirmationUseCase =
      params.dropItemConfirmationUseCase;
    this.onRefresh = params.onRefresh;
  }

  createBasePanel(): void {
    const panelX = this.panelWidth / 2 - 200;

    const panel = this.scene.add
      .rectangle(panelX, 20, 360, 400, 0x111111, 0.95)
      .setStrokeStyle(1, +`0x${COLORS.gold}`, 0.6);

    panel.name = "details";
    this.container.add(panel);
  }

  showItem(item: InventoryItem): void {
    this.clear();

    const panelX = this.panelWidth / 2 - 150;

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

    if (item.canBeUsed) {
      this.createActionButton(
        panelX - 90,
        160,
        "USAR",
        `${COLORS.green}`,
        () => {
          this.useItemUseCase.execute(item.id);
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
          this.showDropConfirmation(item);
        },
      );
    }

    this.container.add([icon, name, desc]);
  }

  showEmpty(): void {
    this.clear();

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

  clear(): void {
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

  private showDropConfirmation(item: InventoryItem): void {
    const panelX = this.panelWidth / 2 - 200;
    const viewModel =
      this.dropItemConfirmationUseCase.getViewModel();

    this.clear();

    const text = this.scene.add
      .text(panelX, 0, viewModel.message, {
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
      viewModel.confirmLabel,
      `${COLORS.red}`,
      () => {
        this.dropItemConfirmationUseCase.confirm(item.id);
        this.onRefresh();
      },
    );

    this.createActionButton(
      panelX + 70,
      60,
      viewModel.cancelLabel,
      `${COLORS.blue}`,
      () => {
        this.showItem(item);
      },
    );
  }
}
