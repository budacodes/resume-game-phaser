// managers/TextManager.ts
import { GameObjects, Scene } from "phaser";
import { SettingsManager } from "./SettingsManager";

export class TextManager {
  private scene: Scene;
  private settingsManager: SettingsManager;

  // Tamanhos base para cada nível
  private fontSizeLevels = {
    small: 0.85,
    normal: 1.0,
    large: 1.2,
  };

  constructor(scene: Scene) {
    this.scene = scene;
    this.settingsManager = SettingsManager.getInstance();

    // Configura listener para mudanças de tamanho de fonte
    this.scene.game.events.on(
      SettingsManager.EVENTS.FONT_SIZE_CHANGED,
      this.onFontSizeChanged,
      this
    );
  }

  public createText(
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle = {}
  ): GameObjects.Text {
    // Obtém o nível atual de tamanho de fonte
    const fontSizeLevel =
      this.settingsManager.getFontSizeLevel();
    const baseSize = style.fontSize || 16;
    const adjustedSize = Math.round(
      +baseSize * this.fontSizeLevels[fontSizeLevel]
    );

    // Cria o texto com o tamanho ajustado
    const textObject = this.scene.add.text(x, y, text, {
      ...style,
      fontSize: `${adjustedSize}px`,
    });

    // Armazena o tamanho base para ajustes futuros
    (textObject as any).__baseFontSize = baseSize;

    return textObject;
  }

  public updateTextSize(
    textObject: GameObjects.Text
  ): void {
    if (!textObject || !(textObject as any).__baseFontSize)
      return;

    const baseSize = (textObject as any).__baseFontSize;
    const fontSizeLevel =
      this.settingsManager.getFontSizeLevel();
    const adjustedSize = Math.round(
      baseSize * this.fontSizeLevels[fontSizeLevel]
    );

    textObject.setFontSize(`${adjustedSize}px`);
  }

  private onFontSizeChanged(
    level: "small" | "normal" | "large",
    pixelSize: number
  ): void {
    void level;
    // Atualiza todos os textos na cena
    this.scene.children.each((child: any) => {
      if (child.type === "Text" && child.__baseFontSize) {
        this.updateTextSize(child);
      }
    });

    // Também pode atualizar outros elementos que usam texto
    this.scene.children.each((child: any) => {
      if (child.setFontSize) {
        // Para componentes que têm método setFontSize
        child.setFontSize(pixelSize);
      }
    });
  }

  public destroy(): void {
    this.scene.game.events.off(
      SettingsManager.EVENTS.FONT_SIZE_CHANGED,
      this.onFontSizeChanged,
      this
    );
  }
}
