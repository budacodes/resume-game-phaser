// scenes/UIScene.ts
import { Scene } from "phaser";
import VirtualJoystick from "phaser3-rex-plugins/plugins/virtualjoystick.js";
import { DialogPayload } from "../../../config/models/DialogPayload";
import { DialogMode } from "../../../config/types/DialogTypes";
import { CursorManager } from "../../../managers/CursorManager";
import { CursorPort } from "../../../application/ports/CursorPort";
import { SettingsPort } from "../../../application/ports/SettingsPort";
import { QuestQueryPort } from "../../../application/ports/QuestQueryPort";
import { UISceneComposition } from "../../../composition/UISceneComposition";
import { SettingsManager } from "../../../managers/SettingsManager";
import { AudioSystem } from "../intro/systems/AudioSystem";
import { TextTyper } from "../intro/systems/TextTyper";
import { DialogBox } from "./components/DialogBox";
import { Inventory } from "./components/Inventory";
import { QuestLog } from "./components/QuestLog";
import { QuestToast } from "./components/QuestToast";
import { SettingsMenu } from "./components/SettingsMenu";
import { AudioManager } from "../../../managers/AudioManager";

type ActiveUI =
  | "settings"
  | "inventory"
  | "questlog"
  | null;

export class UIScene extends Scene {
  private joystick: VirtualJoystick | null = null;
  public joystickCursorKeys: any = null;
  private settingsButton!: Phaser.GameObjects.Sprite;
  private questLogButton!: Phaser.GameObjects.Sprite;
  private inventoryButton!: Phaser.GameObjects.Sprite;
  private cursorManager!: CursorManager;
  private cursorPort!: CursorPort;
  private settingsPort!: SettingsPort;
  private questQuery!: QuestQueryPort;
  private settingsMenu!: SettingsMenu;
  private questLog!: QuestLog;
  private inventory!: Inventory;
  private isJoystickEnabled = false;
  private isTouchDevice = false;
  private isMobileDevice = false;
  private mainUIContainer!: Phaser.GameObjects.Container;
  private dialogBox!: DialogBox;
  private currentDialogMode: DialogMode = "read";

  // Novos campos para gerenciar diálogos da IntroScene
  private textTyper!: TextTyper;
  private audioSystem!: AudioSystem;
  private isTyping = false;
  private canContinueDialog = false;

  private activeUI: ActiveUI = null;

  audio!: AudioManager;

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
      this,
    );
  }

  create() {
    this.audio = new AudioManager(this);

    this.detectDeviceType();

    // InventoryManager.getInstance().obtainItem("coin");

    this.cursorManager = CursorManager.getInstance();
    this.cursorManager.initialize(this);
    this.cursorManager.setScene(this);
    this.cursorManager.setState("default");
    const composition = new UISceneComposition(
      this,
    ).build();
    this.cursorPort = composition.cursorPort;
    this.settingsPort = composition.settingsPort;
    this.questQuery = composition.questQuery;

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
      this.inventoryButton.setVisible(true);
    });

    this.setupJoystickConditionally();

    // 4. ELEMENTOS DA UI (Menus e Botões)
    this.settingsMenu = new SettingsMenu(
      this,
      this.cursorPort,
      this.settingsPort,
    );
    this.questLog = new QuestLog(
      this,
      this.cursorPort,
      this.questQuery,
    );
    this.inventory = new Inventory(this);

    this.createSettingsButton();
    this.createQuestLogButton();
    this.createInventoryButton();

    // Adicionamos ao container de escala
    this.mainUIContainer.add(this.settingsButton);
    this.mainUIContainer.add(this.questLogButton);
    this.mainUIContainer.add(this.inventoryButton);

    // 5. GESTÃO DE ESCALA E CONFIGURAÇÕES
    const settingsManager = this.settingsPort;
    this.applyCurrentScale(
      settingsManager.getSettings().uiScale,
    );

    this.game.events.on(
      SettingsManager.EVENTS.UI_SETTINGS_CHANGED,
      (settings: any) => {
        this.applyCurrentScale(settings.uiScale);
      },
    );

    // 6. EVENTOS GLOBAIS
    // this.game.events.off("toggle-settings");
    // this.game.events.on("toggle-settings", () => {
    //   this.settingsMenu?.toggle();
    // });

    // if (this.input.keyboard) {
    //   this.input.keyboard.on("keydown-ESC", () => {
    //     if (this.shouldShowInGameButtons()) {
    //       this.settingsMenu?.toggle();
    //     }
    //   });
    // }

    // 7. TOAST E MÚSICA
    const toast = new QuestToast(this);
    this.game.events.on("quest_completed", (quest: any) => {
      toast.show(quest.title);
    });

    // this.manageMusic();

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
      },
    );

    // 8. INICIALIZAÇÃO DO DIALOGBOX E SISTEMAS
    this.initializeDialogSystem();

    this.events.on(Phaser.Scenes.Events.WAKE, () => {
      this.cursorManager.setScene(this);
    });

    this.input.keyboard?.on("keydown-ESC", () => {
      this.toggleUI("settings");
    });

    this.input.keyboard?.on("keydown-I", () => {
      if (this.shouldShowInGameButtons()) {
        this.toggleUI("inventory");
      }
    });

    this.input.keyboard?.on("keydown-Q", () => {
      if (this.shouldShowInGameButtons()) {
        this.toggleUI("questlog");
      }
    });
  }

  private toggleUI(target: ActiveUI): void {
    // Se clicar/pressionar o mesmo → fecha
    if (this.activeUI === target) {
      this.closeAllUI();
      return;
    }

    // Fecha tudo antes de abrir outro
    this.closeAllUI();

    switch (target) {
      case "settings":
        this.settingsMenu?.open();
        break;

      case "inventory":
        this.inventory?.open();
        break;

      case "questlog":
        this.questLog?.open();
        break;
    }

    this.activeUI = target;
  }

  private closeAllUI(): void {
    this.settingsMenu?.close();
    this.inventory?.close();
    this.questLog?.close();

    this.activeUI = null;
  }

  // ─────────────────────────────────────────────
  // DIALOG SYSTEM (NOVO)
  // ─────────────────────────────────────────────
  private initializeDialogSystem(): void {
    // Inicializa sistemas de áudio e digitação
    this.audioSystem = new AudioSystem(this.audio);
    this.audioSystem.setup();

    this.textTyper = new TextTyper(this, this.audioSystem);

    // Cria o DialogBox
    this.dialogBox = new DialogBox(
      this,
      undefined,
      undefined,
      this.settingsPort,
    );
    this.dialogBox.hide();

    // Define que estamos em modo intro inicialmente
    this.currentDialogMode = "intro" as DialogMode;

    // ===== EVENTOS PARA INTRO SCENE =====

    // Evento: Mostrar diálogo com digitação
    this.game.events.on(
      "intro-show-dialog",
      (data: { text: string; hint?: string }) => {
        this.currentDialogMode = "intro" as DialogMode;
        this.showIntroDialog(data.text, data.hint);
      },
    );

    // Evento: Esconder diálogo
    this.game.events.on("intro-hide-dialog", () => {
      this.hideIntroDialog();
    });

    // Evento: Setar hint do diálogo
    this.game.events.on(
      "intro-set-hint",
      (hint: string | null) => {
        this.dialogBox.setHint(this.formatHint(hint), {
          reflow: false,
        });
      },
    );

    // Evento: Limpar texto do diálogo
    this.game.events.on("intro-clear-dialog", () => {
      this.dialogBox.clearText();
      this.dialogBox.clearHint();
    });

    // Evento: Mudar modo do diálogo (intro -> read)
    this.game.events.on(
      "set-dialog-mode",
      (mode: string) => {
        this.currentDialogMode = mode as DialogMode;
      },
    );

    // ===== EVENTOS PARA MAIN SCENE =====

    this.game.events.on("hide-dialog", () => {
      this.currentDialogMode = "read";
      this.dialogBox.hide();
      this.dialogBox.clearHint();
      this.game.events.emit("dialog-finished");
    });

    this.game.events.on(
      "dialog-started",
      (payload: DialogPayload) => {
        const mode = payload.mode ?? "read";
        this.currentDialogMode = mode;

        const hint = this.formatHint(payload.hint ?? null);
        this.dialogBox.setHint(hint, { reflow: false });
        this.dialogBox.prepareLayoutFor(payload.text, hint);
        this.dialogBox.show(payload.text, { autoResize: false });
      },
    );

    // Listener para SPACE durante digitação da intro
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.handleDialogAdvance();
    });

    // Listener para E durante diálogos da MainScene/InteriorScene
    this.input.keyboard?.on("keydown-E", () => {
      this.handleEPress();
    });

    // Toque/click em qualquer lugar da tela
    this.input.on("pointerdown", () => {
      this.handleDialogAdvance();
    });
  }

  /**
   * NOVO: Gerencia tecla E para fechar diálogos da MainScene/InteriorScene
   */
  private handleEPress(): void {
    // Só funciona se estiver em modo "read" (MainScene/InteriorScene)
    if (this.currentDialogMode !== "read") {
      return;
    }

    // Se o dialogBox estiver visível, fecha
    if (this.dialogBox.isVisible()) {
      this.game.events.emit("hide-dialog");
    }
  }

  private showIntroDialog(
    text: string,
    hint?: string,
  ): void {
    // Para qualquer digitação anterior
    this.textTyper.stop();

    // Limpa o texto
    this.dialogBox.clearText();
    this.dialogBox.clearHint();

    // Mostra o dialogBox
    if (hint) {
      this.dialogBox.setHint(this.formatHint(hint), {
        reflow: false,
      });
    } else {
      this.dialogBox.clearHint();
    }

    // Calcula e ajusta altura com base no texto FINAL e hint
    this.dialogBox.prepareLayoutFor(
      text,
      this.formatHint(hint ?? null),
    );

    // Agora sim mostra a caixa (com texto vazio, sem auto-resize)
    this.dialogBox.show("", { autoResize: false });

    // Inicia a digitação
    this.isTyping = true;
    this.canContinueDialog = false;

    this.textTyper.typeText(
      (this.dialogBox as any).textContent,
      text,
      () => {
        // Callback quando terminar de digitar
        this.isTyping = false;
        this.canContinueDialog = true;

        // Notifica a IntroScene que terminou
        this.game.events.emit(
          "intro-dialog-typing-finished",
        );
      },
    );
  }

  private hideIntroDialog(): void {
    this.textTyper.stop();
    this.dialogBox.hide();
    this.dialogBox.clearHint();
    this.isTyping = false;
    this.canContinueDialog = false;
  }

  private handleDialogAdvance(): void {
    // Se o dialogBox não estiver visível, ignora
    if (!this.dialogBox.isVisible()) {
      return;
    }

    // Se estiver na MainScene, usa o comportamento antigo
    if (this.currentDialogMode === "read") {
      this.game.events.emit("hide-dialog");
      return;
    }

    // Se não estiver no modo intro, ignora
    if (
      this.currentDialogMode !== ("intro" as DialogMode)
    ) {
      return;
    }

    // Se estiver na IntroScene
    if (this.isTyping) {
      // Pula a digitação
      this.textTyper.skipTyping();
      this.isTyping = false;
      this.canContinueDialog = true;
      this.game.events.emit("intro-dialog-typing-finished");
    } else if (this.canContinueDialog) {
      // Notifica que o usuário quer continuar
      this.canContinueDialog = false; // Previne múltiplos disparos
      this.game.events.emit("intro-dialog-continue");
    }
  }

  private formatHint(
    hint: string | null,
  ): string | null {
    if (!hint) return hint;
    if (this.isTouchDevice || this.isMobileDevice) {
      return hint.replace(/ESPAÇO/gi, "TOQUE");
    }
    return hint;
  }

  // ─────────────────────────────────────────────
  // MÉTODOS EXISTENTES (mantidos)
  // ─────────────────────────────────────────────

  private applyCurrentScale(scale: number): void {
    if (!this.mainUIContainer) return;

    this.mainUIContainer.setScale(scale);
    this.updateElementsPosition(scale);

    const rightEdge = this.scale.width / scale;

    if (this.settingsButton) {
      this.settingsButton.setPosition(rightEdge - 40, 40);
    }

    if (this.questLogButton) {
      this.questLogButton.setPosition(rightEdge - 100, 40);
    }

    if (this.inventoryButton) {
      this.inventoryButton.setPosition(rightEdge - 160, 40);
    }

    if (this.joystick) {
      (this.joystick as any).base?.setScale(scale);
      (this.joystick as any).thumb?.setScale(scale);
      this.joystick.x = 100 * scale;
      this.joystick.y = this.scale.height - 100 * scale;
    }
  }

  private updateElementsPosition(scale: number): void {
    const adjustedX = this.scale.width / scale - 40;

    if (this.settingsButton) {
      this.settingsButton.setPosition(adjustedX, 40);
    }

    if (this.questLogButton) {
      this.questLogButton.setPosition(adjustedX - 60, 40);
    }

    if (this.inventoryButton) {
      this.inventoryButton.setPosition(adjustedX - 80, 40);
    }
  }

  private createFallbackTextures(): void {
    if (!this.textures.exists("settings")) {
      const canvas = this.textures.createCanvas(
        "settings",
        32,
        32,
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
        32,
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
        16,
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
        16,
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
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(
      x + width,
      y,
      x + width,
      y + radius,
    );
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height,
    );
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(
      x,
      y + height,
      x,
      y + height - radius,
    );
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private createSettingsButton() {
    const cursorManager = this.cursorManager;
    const x = this.scale.width - 40;
    const y = 40;

    this.settingsButton = this.add
      .sprite(x, y, "settings")
      .setScale(0.075)
      .setInteractive({ useHandCursor: false });

    this.settingsButton.on("pointerover", () => {
      cursorManager.setState("pointer");
      this.game.events.emit("ui:hover-start");
      this.settingsButton.setScale(0.1);
    });

    this.settingsButton.on("pointerout", () => {
      cursorManager.setState("default");
      this.game.events.emit("ui:hover-end");
      this.settingsButton.setScale(0.075);
    });

    this.settingsButton.on("pointerdown", () => {
      this.settingsButton.setScale(0.065);
      this.toggleUI("settings");

      this.time.delayedCall(100, () => {
        this.settingsButton.setScale(0.075);
      });
    });
  }

  private createInventoryButton() {
    const cursorManager = this.cursorManager;
    const x = this.scale.width - 80;
    const y = 40;

    this.inventoryButton = this.add
      .sprite(x, y, "inventory")
      .setScale(0.075)
      .setInteractive({ useHandCursor: false });

    this.inventoryButton.on("pointerover", () => {
      cursorManager.setState("pointer");
      this.game.events.emit("ui:hover-start");
      this.inventoryButton.setScale(0.1);
    });

    this.inventoryButton.on("pointerout", () => {
      cursorManager.setState("default");
      this.game.events.emit("ui:hover-end");
      this.inventoryButton.setScale(0.075);
    });

    this.inventoryButton.on("pointerdown", () => {
      this.inventoryButton.setScale(0.065);
      this.toggleUI("inventory");

      this.time.delayedCall(100, () => {
        this.inventoryButton.setScale(0.075);
      });

      this.inventoryButton.setVisible(
        this.shouldShowInGameButtons(),
      );
    });
  }

  private shouldShowInGameButtons(): boolean {
    const sceneManager = this.scene.manager;
    const isIntroActive =
      sceneManager.isActive("IntroScene") ||
      sceneManager.isActive("SplashScene");

    return !isIntroActive;
  }

  private createQuestLogButton() {
    const cursorManager = this.cursorManager;
    const x = this.scale.width - 60;
    const y = 40;

    this.questLogButton = this.add
      .sprite(x, y, "questlog")
      .setScale(0.075)
      .setInteractive({ useHandCursor: false });

    this.questLogButton.on("pointerover", () => {
      cursorManager.setState("pointer");
      this.game.events.emit("ui:hover-start");
      this.questLogButton.setScale(0.1);
    });

    this.questLogButton.on("pointerout", () => {
      cursorManager.setState("default");
      this.game.events.emit("ui:hover-end");
      this.questLogButton.setScale(0.075);
    });

    this.questLogButton.on("pointerdown", () => {
      this.questLogButton.setScale(0.065);
      this.toggleUI("questlog");

      this.time.delayedCall(100, () => {
        this.questLogButton.setScale(0.075);
      });

      this.questLogButton.setVisible(
        this.shouldShowInGameButtons(),
      );
    });
  }

  private detectDeviceType(): void {
    this.isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    this.isMobileDevice = /android|iphone|ipad|ipod/i.test(
      navigator.userAgent.toLowerCase(),
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

  update() {
    if (this.joystick && this.isJoystickEnabled) {
      (this.joystick as any).x = 100;
      (this.joystick as any).y = this.scale.height - 100;
    }

    if (this.cursorManager) {
      this.cursorManager.update();
    }

    const shouldShowQuestButton =
      this.shouldShowInGameButtons();

    if (
      this.questLogButton.visible !== shouldShowQuestButton
    ) {
      this.questLogButton.setVisible(shouldShowQuestButton);
    }

    if (
      this.inventoryButton.visible !== shouldShowQuestButton
    ) {
      this.inventoryButton.setVisible(
        shouldShowQuestButton,
      );
    }
  }
}
