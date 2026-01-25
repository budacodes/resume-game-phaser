import { Scene } from "phaser";
import {
  PlayerGender,
  GenderOption,
} from "../../../../config/types/IntroTypes";
import { INTRO_CONFIG } from "../config/IntroConfig";
import { CursorManager } from "../../../../managers/CursorManager";

interface OptionContainerData {
  card: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Text;
  color: number;
  key: PlayerGender;
}

export class GenderOptions {
  private scene: Scene;
  private options: Phaser.GameObjects.Container[] = [];
  private optionData: Map<
    Phaser.GameObjects.Container,
    OptionContainerData
  > = new Map();
  private onSelect: (gender: PlayerGender) => void;
  private onHover: (gender: PlayerGender) => void;

  private cursorManager!: CursorManager;

  constructor(
    scene: Scene,
    onSelect: (gender: PlayerGender) => void,
    onHover: (gender: PlayerGender) => void
  ) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.onHover = onHover;
  }

  create(): void {
    this.cursorManager = CursorManager.getInstance();

    const genderOptions: GenderOption[] = [
      {
        key: "nonbinary",
        label: "NÃO-BINÁRIO",
        color: INTRO_CONFIG.colors.nonbinary,
        icon: "⚧",
        sprite: "nonbinary-run",
        face: "nonbinary-face",
        animation: "nonbinary-running-down",
      },
      {
        key: "female",
        label: "FEMININO",
        color: INTRO_CONFIG.colors.female,
        icon: "♀",
        sprite: "female-run",
        face: "female-face",
        animation: "female-running-down",
      },
      {
        key: "male",
        label: "MASCULINO",
        color: INTRO_CONFIG.colors.male,
        icon: "♂",
        sprite: "male-run",
        face: "male-face",
        animation: "male-running-down",
      },
    ];

    const startX = this.scene.scale.width / 2 - 200;
    const spacing = 200;

    genderOptions.forEach((option, index) => {
      const x = startX + spacing * index;
      const y = 420;

      const container = this.createOptionCard(x, y, option);
      this.options.push(container);
    });
  }

  private createOptionCard(
    x: number,
    y: number,
    option: GenderOption
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Cria o card (retângulo)
    const card = this.scene.add.graphics();
    card.fillStyle(option.color, 1);
    card.fillRoundedRect(-80, -70, 160, 140, 10);
    card.lineStyle(3, option.color, 0.8);
    card.strokeRoundedRect(-80, -70, 160, 140, 10);

    // Cria o ícone
    const icon = this.scene.add
      .text(0, -35, option.icon, {
        fontFamily: "VT323",
        fontSize: "56px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Cria o label
    const label = this.scene.add
      .text(0, 20, option.label, {
        ...INTRO_CONFIG.fonts.dialog,
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 140 },
      })
      .setOrigin(0.5);

    // Adiciona elementos ao container
    container.add([card, icon, label]);

    // Armazena os dados em um Map para fácil acesso
    this.optionData.set(container, {
      card,
      label,
      icon,
      color: option.color,
      key: option.key,
    });

    // Configura interatividade
    this.setupInteractivity(container, card, y, option.key);

    return container;
  }

  private setupInteractivity(
    container: Phaser.GameObjects.Container,
    card: Phaser.GameObjects.Graphics,
    originalY: number,
    genderKey: PlayerGender
  ): void {
    card.setInteractive(
      new Phaser.Geom.Rectangle(-80, -70, 160, 140),
      Phaser.Geom.Rectangle.Contains
    );

    card.on("pointerover", () => {
      this.cursorManager.setState("hover");

      this.onHover(genderKey);

      this.scene.tweens.add({
        targets: container,
        y: originalY - 10,
        duration: 200,
        ease: "Sine.easeOut",
      });
    });

    card.on("pointerout", () => {
      this.cursorManager.setState("default");

      this.scene.tweens.add({
        targets: container,
        y: originalY,
        duration: 200,
        ease: "Sine.easeOut",
      });
    });

    card.on("pointerdown", () => {
      this.onSelect(genderKey);
    });
  }

  highlightSelected(selectedGender: PlayerGender): void {
    this.options.forEach((container) => {
      const data = this.optionData.get(container);
      if (!data) return;

      const { card, label, icon, color, key } = data;
      const isSelected = key === selectedGender;

      card.clear();

      if (isSelected) {
        // Card selecionado - mais brilhante
        card.fillStyle(color, 0.4);
        card.fillRoundedRect(-80, -70, 160, 140, 10);
        card.lineStyle(4, 0xffffff, 1);
        card.strokeRoundedRect(-80, -70, 160, 140, 10);

        label.setColor("#ffffff");
        icon.setColor("#ffffff");

        // Efeito de seleção
        this.scene.tweens.add({
          targets: container,
          scale: { from: 1, to: 1.1 },
          duration: 200,
          yoyo: true,
        });
      } else {
        // Card não selecionado - mais escuro
        card.fillStyle(color, 0.1);
        card.fillRoundedRect(-80, -70, 160, 140, 10);
        card.lineStyle(2, 0x666666, 0.5);
        card.strokeRoundedRect(-80, -70, 160, 140, 10);

        label.setColor("#666666");
        icon.setColor("#666666");
      }
    });
  }

  destroy(): void {
    this.options.forEach((container) => {
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        ease: "Power2",
        duration: 1000,
      });

      container.destroy();
    });

    this.options = [];
    this.optionData.clear();
  }
}
