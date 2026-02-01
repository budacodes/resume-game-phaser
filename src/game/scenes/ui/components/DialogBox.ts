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

  private hint: Phaser.GameObjects.Text; // Novo campo

  private bg!: Phaser.GameObjects.Graphics;
  private shadow!: Phaser.GameObjects.Graphics;

  private readonly PADDING_TOP = 25;
  private readonly PADDING_BOTTOM = 30;
  private readonly PADDING_HORIZONTAL = 25;
  private readonly HINT_HEIGHT = 20;
  private readonly MIN_HEIGHT = 120;

  constructor(
    scene: Scene,
    width: number = 500,
    height: number = 150,
    settingsPort?: SettingsPort,
  ) {
    this.scene = scene;
    this.size = { width, height };

    // Criamos o container
    this.container = this.scene.add
      .container(0, 0)
      .setDepth(1000)
      .setVisible(false);

    // Pegamos as configurações atuais
    const settingsProvider =
      settingsPort ??
      new SettingsManagerAdapter(
        SettingsManager.getInstance(this.scene.game),
      );
    const settings = settingsProvider.getSettings();

    // Texto com escala de fonte aplicada
    const fontSize = 16 + settings.fontSize * 8; // Ex: 0 -> 16px, 1 -> 24px

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
        color: "#00ff00", // Ou a cor de destaque do seu INTRO_CONFIG
      })
      .setOrigin(0.5, 1)
      .setVisible(false);

    this.createBox();
    this.applyScale(settings.uiScale);

    // Ouvir mudanças de escala globais
    this.scene.game.events.on(
      SettingsManager.EVENTS.UI_SETTINGS_CHANGED,
      (newSettings: any) => {
        this.applyScale(newSettings.uiScale);
        this.updateFontSize(newSettings.fontSize);
      },
    );
  }

  private calculateHeightFromText(text: string): number {
    // Texto temporário para cálculo
    this.textContent.setText(text);

    // Força update do BBCodeText
    this.textContent.updateText();

    const bounds = this.textContent.getBounds();
    const textHeight = bounds.height;

    let totalHeight =
      this.PADDING_TOP + textHeight + this.PADDING_BOTTOM;

    // Se o hint estiver visível, reserva espaço
    if (this.hint.visible) {
      totalHeight += this.HINT_HEIGHT;
    }

    return Math.max(totalHeight, this.MIN_HEIGHT);
  }

  clearText(): void {
    this.textContent.setText("");
  }

  clearHint(): void {
    this.setHint(null);
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
    this.bg.fillStyle(0x222222, 0.9); // Cor padrão escura
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

    // Posicionar o prompt na parte inferior interna da caixa
    this.hint.setPosition(0, height / 2 - 15);

    this.textContent.setOrigin(0, 0);
    this.textContent.setPosition(
      -width / 2 + 25,
      -height / 2 + 25,
    );

    this.container.add([
      this.shadow,
      this.bg,
      this.textContent,
      this.hint,
    ]);

    // Centraliza na base da tela por padrão
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

    // Reposiciona texto
    this.textContent.setPosition(
      -width / 2 + 25,
      -height / 2 + 25,
    );

    // Reposiciona hint
    this.hint.setPosition(0, height / 2 - 15);

    // Reposiciona container na tela
    this.container.setPosition(
      this.scene.scale.width / 2,
      this.scene.scale.height - height / 2 - 40,
    );
  }

  public setHint(text: string | null): void {
    if (!this.hint) return;

    if (text === null) {
      this.hint.setVisible(false);
      this.scene.tweens.killTweensOf(this.hint);
      return;
    }

    this.hint.setText(text);
    this.hint.setVisible(true);

    // Reinicia o efeito de piscar para o novo texto
    this.scene.tweens.killTweensOf(this.hint);
    this.hint.alpha = 1;
    this.scene.tweens.add({
      targets: this.hint,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  public setContinueVisible(visible: boolean): void {
    this.hint.setVisible(visible);
    if (visible) {
      // Opcional: Adicionar um pequeno efeito de piscar
      this.scene.tweens.add({
        targets: this.hint,
        alpha: { from: 0.4, to: 1 },
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.scene.tweens.killTweensOf(this.hint);
      this.hint.alpha = 1;
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

  public show(text: string): void {
    this.stopTyping(); // Garante que qualquer timer interno antigo morra

    const height = this.calculateHeightFromText(text);
    this.resize(height);

    this.container.setVisible(true);
    this.textContent.setText(text);

    this.scene.tweens.add({
      targets: this.container,
      scaleY: { from: 0, to: 1 },
      duration: 500,
      ease: "Back.Out",
    });
  }

  public hide(): void {
    this.stopTyping();
    this.container.setVisible(false);
    this.textContent.setText("");
  }

  private stopTyping() {
    if (this.typingTimer) {
      this.typingTimer.destroy(); // Use destroy para garantir que o evento pare
      this.typingTimer = undefined;
    }
  }

  public isVisible(): boolean {
    return this.container.visible;
  }
}
