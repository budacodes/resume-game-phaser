// scenes/UIScene.ts
import { Scene } from "phaser";
import VirtualJoystick from "phaser3-rex-plugins/plugins/virtualjoystick.js";
import { DialogPayload } from "../../../config/models/DialogPayload";
import { DialogMode } from "../../../config/types/DialogTypes";
import { CursorManager } from "../../../managers/CursorManager";
import { SettingsManager } from "../../../managers/SettingsManager";
import { DialogBox } from "./components/_DialogBox";
import { QuestLog } from "./components/QuestLog";
import { QuestToast } from "./components/QuestToast";
import { SettingsMenu } from "./components/SettingsMenu";

export class UIScene extends Scene {
  private joystick: VirtualJoystick | null = null;
  private bgm!: Phaser.Sound.BaseSound;
  public joystickCursorKeys: any = null;
  private settingsButton!: Phaser.GameObjects.Sprite;
  private questLogButton!: Phaser.GameObjects.Sprite;
  private cursorManager!: CursorManager;
  private settingsMenu!: SettingsMenu;
  private questLog!: QuestLog;
  private isJoystickEnabled = false;
  private isTouchDevice = false;
  private isMobileDevice = false;
  private mainUIContainer!: Phaser.GameObjects.Container;
  private dialogBox!: DialogBox;
  private currentDialogMode: DialogMode = "read";

  constructor() {
    super({ key: "UIScene" });
  }

  preload() {
    this.load.on(
      "loaderror",
      (file: any) => {
        console.warn(`Erro ao carregar: ${file.key}`);
        this.createFallbackTextures();
      },
      this
    );
  }

  create() {
    this.detectDeviceType();

    this.cursorManager = CursorManager.getInstance();
    this.cursorManager.initialize(this);
    this.cursorManager.setScene(this);
    this.cursorManager.setState("default");

    // 1. Criamos o container da HUD
    this.mainUIContainer = this.add.container(0, 0);

    // Garantimos que o cursor ignore o sistema nativo
    this.input.setDefaultCursor("none");
    this.game.canvas.style.cursor = "none";

    if (this.textures.exists("custom-cursor")) {
      this.cursorManager.setCustomCursorEnabled(true);
    }

    // 3. LISTENERS DE SISTEMA
    this.game.events.on("focus", () => {
      this.input.setDefaultCursor("none");
      this.game.canvas.style.cursor = "none";
    });

    this.game.events.on("show-hud", () => {
      this.showJoystick();
      this.settingsButton.setVisible(true);
      this.questLogButton.setVisible(true);
    });

    this.setupJoystickConditionally();

    // 4. ELEMENTOS DA UI (Menus e Botões)
    // Nota: O Cursor sprite já foi criado, mas ele será atualizado no update
    // ou mantido no topo pelo depth.
    this.settingsMenu = new SettingsMenu(this);
    this.questLog = new QuestLog(this);

    this.createSettingsButton();
    this.createQuestLogButton();

    // Adicionamos ao container de escala
    this.mainUIContainer.add(this.settingsButton);
    this.mainUIContainer.add(this.questLogButton);

    // 5. GESTÃO DE ESCALA E CONFIGURAÇÕES
    const settingsManager = SettingsManager.getInstance(
      this.game
    );
    this.applyCurrentScale(
      settingsManager.getSettings().uiScale
    );

    this.game.events.on(
      SettingsManager.EVENTS.UI_SETTINGS_CHANGED,
      (settings: any) => {
        this.applyCurrentScale(settings.uiScale);
      }
    );

    // 6. EVENTOS GLOBAIS
    this.game.events.off("toggle-settings");
    this.game.events.on("toggle-settings", () => {
      this.settingsMenu?.toggle();
    });

    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ESC", () => {
        this.settingsMenu?.toggle();
      });
    }

    // 7. TOAST E MÚSICA
    const toast = new QuestToast(this);
    this.game.events.on("quest_completed", (quest: any) => {
      toast.show(quest.title);
    });

    this.manageMusic();

    this.events.on("shutdown", () => {
      this.destroyJoystick();
      this.settingsMenu?.destroy();
    });

    this.game.events.on(
      "scene-changed",
      (sceneKey: string) => {
        if (sceneKey === "IntroScene") {
          this.input.setDefaultCursor("none");
          this.game.canvas.style.cursor = "none";
          this.cursorManager.setState("default");
        }

        if (sceneKey === "MainScene") {
          this.input.setDefaultCursor("none");
          this.game.canvas.style.cursor = "none";
          this.cursorManager.setState("default");
        }
      }
    );

    this.dialogBox = new DialogBox(this);
    this.dialogBox.hide();

    this.game.events.on("hide-dialog", () => {
      this.dialogBox.hide();
      this.dialogBox.clearHint();
      this.game.events.emit("dialog-finished");
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this.currentDialogMode !== "read") return;

      this.game.events.emit("hide-dialog");
    });

    this.game.events.on(
      "dialog-started",
      (payload: DialogPayload) => {
        const mode = payload.mode ?? "read";
        this.currentDialogMode = mode;

        this.dialogBox.show(payload.text);
        this.dialogBox.setHint(payload.hint ?? null);
      }
    );
  }

  private applyCurrentScale(scale: number): void {
    if (!this.mainUIContainer) return;

    // 1. Aplica a escala ao container
    this.mainUIContainer.setScale(scale);
    this.updateElementsPosition(scale);

    // 2. Reposiciona os elementos INTERNOS do container
    // Para um elemento ficar na direita, dividimos a largura total pela escala
    const rightEdge = this.scale.width / scale;

    if (this.settingsButton) {
      // Agora o botão vai ficar a 40 pixels da borda real, independente da escala
      this.settingsButton.setPosition(rightEdge - 40, 40);
    }

    if (this.questLogButton) {
      // Agora o botão vai ficar a 40 pixels da borda real, independente da escala
      this.questLogButton.setPosition(rightEdge - 100, 40);
    }

    // 3. Ajusta o Joystick se existir
    if (this.joystick) {
      // O joystick geralmente não fica dentro do container de escala
      // para não bugar o touch, então escalamos os componentes dele
      (this.joystick as any).base?.setScale(scale);
      (this.joystick as any).thumb?.setScale(scale);
      // Reposiciona o centro do joystick
      this.joystick.x = 100 * scale;
      this.joystick.y = this.scale.height - 100 * scale;
    }

    this.events.on(Phaser.Scenes.Events.WAKE, () => {
      this.cursorManager.setScene(this);
    });
  }

  private updateElementsPosition(scale: number): void {
    // Calculamos a posição baseada na largura da tela dividida pela escala
    // Ex: Se a tela tem 1000px e a escala é 2, o ponto "1000" no container estará em 2000px reais.
    // Para fixar na borda direita: x = (largura / escala) - margem
    const adjustedX = this.scale.width / scale - 40;
    const adjustedY = 40 / scale; // Se quiser que ele suba menos

    if (this.settingsButton) {
      this.settingsButton.setPosition(adjustedX, 40);
    }

    if (this.questLogButton) {
      this.questLogButton.setPosition(adjustedX - 60, 40);
    }
  }

  private createFallbackTextures(): void {
    if (!this.textures.exists("settings")) {
      const canvas = this.textures.createCanvas(
        "settings",
        32,
        32
      );
      const ctx = canvas.getContext();

      ctx.fillStyle = "#4a90e2";
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.fill();

      canvas.refresh();
    }

    if (!this.textures.exists("ui_close")) {
      const canvas = this.textures.createCanvas(
        "ui_close",
        32,
        32
      );
      const ctx = canvas.getContext();

      ctx.fillStyle = "#ff5555";
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();

      canvas.refresh();
    }

    if (!this.textures.exists("expand")) {
      const canvas = this.textures.createCanvas(
        "expand",
        32,
        16
      );
      const ctx = canvas.getContext();

      ctx.fillStyle = "#4CAF50";
      this.drawRoundedRect(ctx, 0, 0, 32, 16, 8);
      ctx.fill();

      canvas.refresh();
    }

    if (!this.textures.exists("minimize")) {
      const canvas = this.textures.createCanvas(
        "minimize",
        32,
        16
      );
      const ctx = canvas.getContext();

      ctx.fillStyle = "#ff5555";
      this.drawRoundedRect(ctx, 0, 0, 32, 16, 8);
      ctx.fill();

      canvas.refresh();
    }
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(
      x + width,
      y,
      x + width,
      y + radius
    );
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(
      x,
      y + height,
      x,
      y + height - radius
    );
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // ─────────────────────────────────────────────
  // SETTINGS BUTTON
  // ─────────────────────────────────────────────
  private createSettingsButton() {
    const cursorManager = CursorManager.getInstance();

    const x = this.scale.width - 40;
    const y = 40;

    this.settingsButton = this.add
      .sprite(x, y, "settings")
      .setScale(0.075)
      .setInteractive({ useHandCursor: false });

    this.settingsButton.on("pointerover", () => {
      cursorManager.setState("pointer");
      this.settingsButton.setScale(0.1);
    });

    this.settingsButton.on("pointerout", () => {
      cursorManager.setState("default");
      this.settingsButton.setScale(0.075);
    });

    this.settingsButton.on("pointerdown", () => {
      this.settingsButton.setScale(0.065);
      this.settingsMenu?.toggle();

      this.time.delayedCall(100, () => {
        this.settingsButton.setScale(0.075);
      });
    });
  }

  private shouldShowQuestButton(): boolean {
    const sceneManager = this.scene.manager;

    const isIntroActive =
      sceneManager.isActive("IntroScene") ||
      sceneManager.isActive("SplashScene");

    return !isIntroActive;
  }

  // ─────────────────────────────────────────────
  // QUESTLOG BUTTON
  // ─────────────────────────────────────────────
  private createQuestLogButton() {
    const cursorManager = CursorManager.getInstance();

    const x = this.scale.width - 60;
    const y = 40;

    this.questLogButton = this.add
      .sprite(x, y, "questlog")
      .setScale(0.075)
      .setInteractive({ useHandCursor: false });

    this.questLogButton.on("pointerover", () => {
      cursorManager.setState("pointer");
      this.questLogButton.setScale(0.1);
    });

    this.questLogButton.on("pointerout", () => {
      cursorManager.setState("default");
      this.questLogButton.setScale(0.075);
    });

    this.questLogButton.on("pointerdown", () => {
      this.questLogButton.setScale(0.065);

      // const questManager = QuestManager.getInstance(
      //   this.game
      // );
      // questManager.completeQuest("buda");

      // this.game.events.emit("quest_completed", {
      //   title: "Quest Teste",
      // });

      this.questLog?.toggle();

      this.time.delayedCall(100, () => {
        this.questLogButton.setScale(0.075);
      });

      this.questLogButton.setVisible(
        this.shouldShowQuestButton()
      );
    });
  }

  // ─────────────────────────────────────────────
  // DEVICE / JOYSTICK
  // ─────────────────────────────────────────────
  private detectDeviceType(): void {
    this.isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    this.isMobileDevice = /android|iphone|ipad|ipod/i.test(
      navigator.userAgent.toLowerCase()
    );
  }

  private setupJoystickConditionally(): void {
    if (this.isTouchDevice || this.isMobileDevice) {
      this.createJoystick();
      this.hideJoystick();
    }
  }

  private createJoystick(): void {
    if (this.joystick) this.joystick.destroy();

    this.joystick = new VirtualJoystick(this, {
      x: 100,
      y: this.scale.height - 100,
      radius: 50,
      base: this.add
        .circle(0, 0, 50, 0x888888)
        .setAlpha(0.5),
      thumb: this.add
        .circle(0, 0, 25, 0xcccccc)
        .setAlpha(0.8),
      dir: "8dir",
      forceMin: 16,
      enable: false,
    });

    this.joystickCursorKeys =
      this.joystick.createCursorKeys();
  }

  private showJoystick(): void {
    if (!this.joystick) return;
    (this.joystick as any).base?.setVisible(true);
    (this.joystick as any).thumb?.setVisible(true);
    this.joystick.setEnable(true);
    this.isJoystickEnabled = true;
  }

  private hideJoystick(): void {
    if (!this.joystick) return;
    (this.joystick as any).base?.setVisible(false);
    (this.joystick as any).thumb?.setVisible(false);
    this.joystick.setEnable(false);
    this.isJoystickEnabled = false;
  }

  private destroyJoystick(): void {
    this.joystick?.destroy();
    this.joystick = null;
    this.joystickCursorKeys = null;
  }

  // ─────────────────────────────────────────────
  // MUSIC
  // ─────────────────────────────────────────────
  private manageMusic() {
    if (!this.bgm) {
      this.bgm = this.sound.add("bgm_hub", {
        volume: 0.05,
        loop: true,
      });
    }

    if (!this.bgm.isPlaying && !this.sound.locked) {
      this.bgm.play();
    }
  }

  update() {
    if (this.joystick && this.isJoystickEnabled) {
      (this.joystick as any).x = 100;
      (this.joystick as any).y = this.scale.height - 100;
    }

    if (this.cursorManager) {
      this.cursorManager.update();
    }

    const shouldShowQuestButton =
      this.shouldShowQuestButton();

    if (
      this.questLogButton.visible !== shouldShowQuestButton
    ) {
      this.questLogButton.setVisible(shouldShowQuestButton);
    }
  }
}
