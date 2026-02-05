import { Scene } from "phaser";
import { SettingsManager } from "../../../../managers/SettingsManager";
import { SettingsPort } from "../../../../application/ports/SettingsPort";
import { SettingsManagerAdapter } from "../../../../infrastructure/adapters/SettingsManagerAdapter";
import BBCodeText from "phaser3-rex-plugins/plugins/bbcodetext.js";

export class DialogBox {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private textContent: BBCodeText;
  private typingTimer?: Phaser.Time.TimerEvent;
  public size: { width: number; height: number };

  private hint: Phaser.GameObjects.Text;

  private bg!: Phaser.GameObjects.Graphics;
  private shadow!: Phaser.GameObjects.Graphics;

  private readonly PADDING_TOP = 25;
  /**
   * Espaço inferior (abaixo do hint, quando o hint estiver visível).
   * Quando o hint NÃO está visível, este padding é o espaço inferior do texto.
   */
  private readonly PADDING_BOTTOM = 40;

  private readonly PADDING_HORIZONTAL = 25;

  /** Altura aproximada reservada para o hint */
  private readonly HINT_HEIGHT = 20;

  /** Espaço entre o texto e o hint */
  private readonly HINT_MARGIN_TOP = 10;

  private readonly MIN_HEIGHT = 120;

  constructor(
    scene: Scene,
    width: number = 500,
    height: number = 150,
    settingsPort?: SettingsPort,
  ) {
    this.scene = scene;
    this.size = { width, height };

    // Container
    this.container = this.scene.add
      .container(0, 0)
      .setDepth(1000)
      .setVisible(false);

    // Settings
    const settingsProvider =
      settingsPort ??
      new SettingsManagerAdapter(
        SettingsManager.getInstance(this.scene.game),
      );

    const settings = settingsProvider.getSettings();

    // Fonte com escala aplicada
    const fontSize = 16 + settings.fontSize * 8;

    this.textContent = new BBCodeText(
      this.scene,
      0,
      0,
      "",
      {
        fontFamily: "VT323",
        fontSize: `${fontSize}px`,
        color: "#ffffff",
        wrap: {
          width: width - this.PADDING_HORIZONTAL * 2,
        },
        lineSpacing: 8,
      },
    );

    this.hint = this.scene.add
      .text(0, 0, "[ ESPAÇO para continuar ]", {
        fontFamily: "VT323",
        fontSize: "14px",
        color: "#00ff00",
      })
      .setOrigin(0.5, 1)
      .setVisible(false);

    this.createBox();
    this.applyScale(settings.uiScale);

    // Ouve mudanças globais
    this.scene.game.events.on(
      SettingsManager.EVENTS.UI_SETTINGS_CHANGED,
      (newSettings: any) => {
        this.applyScale(newSettings.uiScale);
        this.updateFontSize(newSettings.fontSize);
      },
    );
  }

  private calculateHeightFromText(
    text: string,
    includeHint: boolean,
  ): number {
    // IMPORTANTE: esse método é usado para medir o texto antes de exibir.
    // Para evitar "pulos" visuais, preservamos o texto atual após a medição.
    const previousText = this.textContent.text;

    this.textContent.setText(text);
    this.textContent.updateText();

    const bounds = this.textContent.getBounds();
    const textHeight = bounds.height;

    // Restaura o texto anterior
    this.textContent.setText(previousText);
    this.textContent.updateText();

    // Altura base (topo + texto)
    let totalHeight = this.PADDING_TOP + textHeight;

    // Área inferior:
    // - sem hint: apenas PADDING_BOTTOM
    // - com hint: margem acima do hint + hint + PADDING_BOTTOM (espaço abaixo do hint)
    if (includeHint) {
      totalHeight +=
        this.HINT_MARGIN_TOP +
        this.HINT_HEIGHT +
        this.PADDING_BOTTOM;
    } else {
      totalHeight += this.PADDING_BOTTOM;
    }

    return Math.max(totalHeight, this.MIN_HEIGHT);
  }

  clearText(): void {
    this.textContent.setText("");
  }

  clearHint(): void {
    this.setHint(null, { reflow: false });
  }

  private createBox(): void {
    const { width, height } = this.size;

    this.shadow = this.scene.add.graphics();
    this.shadow
      .fillStyle(0x000000, 0.5)
      .fillRoundedRect(
        -width / 2 + 4,
        -height / 2 + 4,
        width,
        height,
        12,
      );

    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x222222, 0.9);
    this.bg.lineStyle(2, 0xffffff, 0.8);
    this.bg.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      12,
    );
    this.bg.strokeRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      12,
    );

    // Posições iniciais
    this.textContent.setOrigin(0, 0);
    this.textContent.setPosition(
      -width / 2 + this.PADDING_HORIZONTAL,
      -height / 2 + this.PADDING_TOP,
    );

    this.hint.setPosition(
      0,
      height / 2 - this.PADDING_BOTTOM,
    );

    this.container.add([
      this.shadow,
      this.bg,
      this.textContent,
      this.hint,
    ]);

    // Base da tela
    this.container.setPosition(
      this.scene.scale.width / 2,
      this.scene.scale.height - height / 2 - 40,
    );
  }

  private resize(height: number): void {
    this.size.height = height;

    const { width } = this.size;

    this.shadow.clear();
    this.shadow
      .fillStyle(0x000000, 0.5)
      .fillRoundedRect(
        -width / 2 + 4,
        -height / 2 + 4,
        width,
        height,
        12,
      );

    this.bg.clear();
    this.bg
      .fillStyle(0x222222, 0.9)
      .lineStyle(2, 0xffffff, 0.8)
      .fillRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        12,
      )
      .strokeRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        12,
      );

    // Texto sempre no topo interno
    this.textContent.setPosition(
      -width / 2 + this.PADDING_HORIZONTAL,
      -height / 2 + this.PADDING_TOP,
    );

    // Hint sempre no rodapé interno
    this.hint.setPosition(
      0,
      height / 2 - this.PADDING_BOTTOM,
    );

    // Reposiciona container na tela (base)
    this.container.setPosition(
      this.scene.scale.width / 2,
      this.scene.scale.height - height / 2 - 40,
    );
  }

  public setHint(
    text: string | null,
    opts?: { reflow?: boolean; blink?: boolean },
  ): void {
    if (!this.hint) return;

    const reflow = opts?.reflow ?? true;
    const blink = opts?.blink ?? true;

    if (text === null) {
      this.hint.setVisible(false);
      this.scene.tweens.killTweensOf(this.hint);
      this.hint.alpha = 1;

      if (reflow) {
        this.prepareLayoutFor(this.textContent.text);
      }
      return;
    }

    this.hint.setText(text);
    this.hint.setVisible(true);

    if (reflow) {
      this.prepareLayoutFor(this.textContent.text);
    }

    // Piscar opcional
    this.scene.tweens.killTweensOf(this.hint);
    this.hint.alpha = 1;

    if (blink) {
      this.scene.tweens.add({
        targets: this.hint,
        alpha: { from: 1, to: 0.3 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  public setContinueVisible(
    visible: boolean,
    opts?: { blink?: boolean },
  ): void {
    this.hint.setVisible(visible);

    // Evita empilhar tweens
    this.scene.tweens.killTweensOf(this.hint);
    this.hint.alpha = 1;

    const blink = opts?.blink ?? true;

    if (visible && blink) {
      this.scene.tweens.add({
        targets: this.hint,
        alpha: { from: 0.4, to: 1 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private applyScale(scale: number) {
    this.container.setScale(scale);

    // Reposiciona para garantir que não saia da tela ao crescer
    this.container.y =
      this.scene.scale.height -
      (this.size.height * scale) / 2 -
      20;
  }

  private updateFontSize(fontSizeMultiplier: number) {
    const newSize = 16 + fontSizeMultiplier * 8;
    this.textContent.setFontSize(`${newSize}px`);
  }

  public prepareLayoutFor(
    fullText: string,
    hintText?: string | null,
  ): void {
    const includeHint = hintText !== null && hintText !== undefined;
    const height = this.calculateHeightFromText(
      fullText,
      includeHint,
    );
    this.resize(height);
  }

  public show(
    text: string = "",
    opts?: { autoResize?: boolean; animate?: boolean },
  ): void {
    this.stopTyping();

    const autoResize = opts?.autoResize ?? true;
    const animate = opts?.animate ?? true;

    if (autoResize) {
      const height = this.calculateHeightFromText(
        text,
        this.hint.visible,
      );
      this.resize(height);
    }

    this.container.setVisible(true);
    this.textContent.setText(text);

    if (animate) {
      this.scene.tweens.add({
        targets: this.container,
        scaleY: { from: 0, to: 1 },
        duration: 500,
        ease: "Back.Out",
      });
    } else {
      this.container.setScale(this.container.scaleX, 1);
    }
  }

  public hide(): void {
    this.stopTyping();
    this.container.setVisible(false);
    this.textContent.setText("");
  }

  private stopTyping() {
    if (this.typingTimer) {
      this.typingTimer.destroy();
      this.typingTimer = undefined;
    }
  }

  public isVisible(): boolean {
    return this.container.visible;
  }
}
