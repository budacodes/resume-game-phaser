import { Scene } from "phaser";
import { SettingsManager } from "../../../../managers/SettingsManager";

export class DialogBox {
  private scene: Scene;
  private container: Phaser.GameObjects.Container;
  private textContent: Phaser.GameObjects.Text;
  private typingTimer?: Phaser.Time.TimerEvent;
  public size: { width: number; height: number };

  private hint: Phaser.GameObjects.Text; // Novo campo

  constructor(
    scene: Scene,
    width: number = 400,
    height: number = 150
  ) {
    this.scene = scene;
    this.size = { width, height };

    // Criamos o container
    this.container = this.scene.add
      .container(0, 0)
      .setDepth(1000)
      .setVisible(false);

    // Pegamos as configurações atuais
    const settings = SettingsManager.getInstance(
      this.scene.game
    ).getSettings();

    // Texto com escala de fonte aplicada
    const fontSize = 16 + settings.fontSize * 8; // Ex: 0 -> 16px, 1 -> 24px

    this.textContent = this.scene.add.text(0, 0, "", {
      fontFamily: "VT323",
      fontSize: `${fontSize}px`,
      color: "#ffffff",
      wordWrap: { width: width - 50 },
      lineSpacing: 8,
    });

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
      }
    );
  }

  clearText(): void {
    this.textContent.setText("");
  }

  clearHint(): void {
    this.setHint(null);
  }

  private createBox(): void {
    const { width, height } = this.size;

    const shadow = this.scene.add.graphics();
    shadow
      .fillStyle(0x000000, 0.5)
      .fillRoundedRect(
        -width / 2 + 4,
        -height / 2 + 4,
        width,
        height,
        12
      );

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x222222, 0.9); // Cor padrão escura
    bg.lineStyle(2, 0xffffff, 0.8);
    bg.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      12
    );
    bg.strokeRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      12
    );

    // Posicionar o prompt na parte inferior interna da caixa
    this.hint.setPosition(0, height / 2 - 15);

    this.textContent.setOrigin(0, 0);
    this.textContent.setPosition(
      -width / 2 + 25,
      -height / 2 + 25
    );

    this.container.add([
      shadow,
      bg,
      this.textContent,
      this.hint,
    ]);

    // Centraliza na base da tela por padrão
    this.container.setPosition(
      this.scene.scale.width / 2,
      this.scene.scale.height - height / 2 - 40
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
    this.container.setVisible(true);
    this.textContent.setText(text);

    // this.startTyping(text); // Começa vazio para o TextTyper preencher
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
