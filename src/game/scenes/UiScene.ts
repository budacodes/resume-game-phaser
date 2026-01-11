// scenes/UIScene.ts
import { Scene } from "phaser";
import VirtualJoystick from "phaser3-rex-plugins/plugins/virtualjoystick.js";
import { CursorManager } from "../../systems/CursorManager";
import { DialogBox } from "../ui/DialogBox";

export class UIScene extends Scene {
  private joystick: VirtualJoystick | null = null;
  private dialogBox!: DialogBox;
  private bgm!: Phaser.Sound.BaseSound;
  public joystickCursorKeys: any = null;
  private muteButton!: Phaser.GameObjects.Sprite;
  private cursorManager!: CursorManager;

  // Controle de cenas
  private currentGameScene: string = "";
  private isJoystickEnabled: boolean = false;
  private isTouchDevice: boolean = false;
  private isMobileDevice: boolean = false;

  constructor() {
    super({ key: "UIScene" });
  }

  preload() {
    // Carrega as imagens do botão de mute (se ainda não carregadas)
    if (!this.textures.exists("icon_sound_on")) {
      // Carrega suas imagens ou use fallback
      this.load.image(
        "icon_sound_on",
        "assets/ui/sound_on.png"
      );
      this.load.image(
        "icon_sound_off",
        "assets/ui/sound_off.png"
      );
    }
  }

  create() {
    // 1. Detecta o tipo de dispositivo
    this.detectDeviceType();

    // 2. INICIALIZA O CURSOR MANAGER (APENAS AQUI!)
    this.cursorManager = CursorManager.getInstance();

    // CRÍTICO: Inicializa apenas se não foi inicializado antes
    if (!this.cursorManager.getCurrentScene()) {
      console.log(
        "UIScene: Inicializando CursorManager pela primeira vez"
      );
      this.cursorManager.initialize(this);
    } else {
      console.log(
        "UIScene: CursorManager já inicializado, apenas atualizando"
      );
      this.cursorManager.updateScene(this);
    }

    // 3. Configura cursor customizado se disponível
    if (this.textures.exists("custom-cursor")) {
      this.cursorManager.setCustomCursorEnabled(true);
    }

    // 4. Esconde cursor do sistema e mostra o customizado
    this.input.setDefaultCursor("none");
    this.cursorManager.fixCursorConflict();
    this.cursorManager.setState("default");

    // 5. Configura evento para quando o jogo ganha foco
    this.game.events.on("focus", () => {
      console.log("Jogo em foco, corrigindo cursor");
      this.input.setDefaultCursor("none");
      this.cursorManager.fixCursorConflict();
    });

    // 6. Configuração inicial do joystick (se necessário)
    this.setupJoystickConditionally();

    // 7. Configuração dos Eventos
    this.createMuteButton();

    // 8. Eventos de diálogo
    this.game.events.off("show-dialog");
    this.game.events.off("hide-dialog");

    this.game.events.on(
      "show-dialog",
      (
        message: string,
        height?: number,
        width?: number
      ) => {
        this.dialogBox.show(message, width, height);
      }
    );

    this.game.events.on("hide-dialog", () => {
      this.dialogBox.hide();
    });

    // 9. Eventos para controle de cenas
    this.game.events.off("scene-changed");
    this.game.events.on(
      "scene-changed",
      (sceneKey: string) => {
        this.onSceneChanged(sceneKey);
      }
    );

    // 10. Eventos para controle do joystick
    this.game.events.off("enable-joystick");
    this.game.events.on("enable-joystick", () => {
      this.enableJoystick();
    });

    this.game.events.off("disable-joystick");
    this.game.events.on("disable-joystick", () => {
      this.disableJoystick();
    });

    // 11. LIMPEZA DE EVENTOS
    this.events.on("shutdown", () => {
      this.game.events.off("show-dialog");
      this.game.events.off("hide-dialog");
      this.game.events.off("scene-changed");
      this.game.events.off("enable-joystick");
      this.game.events.off("disable-joystick");
      this.game.events.off("focus");

      // Destrói o joystick se existir
      this.destroyJoystick();
    });

    // 12. Gerenciamento de Música
    this.manageMusic();
  }

  private detectDeviceType(): void {
    // Detecta se é um dispositivo touch
    this.isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    // Detecta se é um dispositivo móvel
    const userAgent = navigator.userAgent.toLowerCase();
    this.isMobileDevice =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );

    // Detecta se tem teclado físico (não é 100% preciso, mas ajuda)
    const hasKeyboard = this.input.keyboard !== null;

    // Log para debug
    console.log(
      `Device detection - Touch: ${this.isTouchDevice}, Mobile: ${this.isMobileDevice}, Has Keyboard: ${hasKeyboard}`
    );
  }

  private setupJoystickConditionally(): void {
    // Se for dispositivo touch/mobile, cria o joystick mas deixa desabilitado inicialmente
    if (this.isTouchDevice || this.isMobileDevice) {
      this.createJoystick();
      this.isJoystickEnabled = false;
      this.hideJoystick();
    } else {
      this.isJoystickEnabled = false;
    }
  }

  private createJoystick(): void {
    if (this.joystick) {
      this.joystick.destroy();
    }

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
      enable: false, // Inicia desabilitado
    });

    this.joystickCursorKeys =
      this.joystick.createCursorKeys();
  }

  private showJoystick(): void {
    if (this.joystick) {
      // Mostra os elementos visuais
      const base = (this.joystick as any).base;
      const thumb = (this.joystick as any).thumb;

      if (base) base.setVisible(true);
      if (thumb) thumb.setVisible(true);

      // Habilita o funcionamento
      this.joystick.setEnable(true);
      this.isJoystickEnabled = true;
    }
  }

  private hideJoystick(): void {
    if (this.joystick) {
      // Esconde os elementos visuais
      const base = (this.joystick as any).base;
      const thumb = (this.joystick as any).thumb;

      if (base) base.setVisible(false);
      if (thumb) thumb.setVisible(false);

      // Desabilita o funcionamento
      this.joystick.setEnable(false);
      this.isJoystickEnabled = false;
    }
  }

  private destroyJoystick(): void {
    if (this.joystick) {
      this.joystick.destroy();
      this.joystick = null;
      this.joystickCursorKeys = null;
    }
  }

  private onSceneChanged(sceneKey: string): void {
    console.log(`Scene changed to: ${sceneKey}`);
    this.currentGameScene = sceneKey;

    // Lista de cenas "internas" onde o joystick deve aparecer
    const internalScenes = [
      "MainScene",
      "HubScene",
      "DungeonScene",
      "BattleScene",
      "ExplorationScene",
    ];

    // Lista de cenas "externas" onde o joystick não deve aparecer
    const externalScenes = [
      "IntroScene",
      "MenuScene",
      "OptionsScene",
      "CreditsScene",
      "GameOverScene",
    ];

    if (internalScenes.includes(sceneKey)) {
      // Cena interna: mostra joystick se for dispositivo touch/mobile
      if (this.isTouchDevice || this.isMobileDevice) {
        this.enableJoystick();
      }
    } else if (externalScenes.includes(sceneKey)) {
      // Cena externa: sempre esconde o joystick
      this.disableJoystick();
    } else {
      // Cena desconhecida: usa comportamento padrão baseado no dispositivo
      if (this.isTouchDevice || this.isMobileDevice) {
        this.enableJoystick();
      } else {
        this.disableJoystick();
      }
    }
  }

  public enableJoystick(): void {
    if (
      !this.joystick &&
      (this.isTouchDevice || this.isMobileDevice)
    ) {
      this.createJoystick();
    }

    if (this.joystick) {
      this.showJoystick();
      console.log("Joystick enabled");
    }
  }

  public disableJoystick(): void {
    if (this.joystick) {
      this.hideJoystick();
      console.log("Joystick disabled");
    }
  }

  public toggleJoystick(): void {
    if (this.isJoystickEnabled) {
      this.disableJoystick();
    } else {
      this.enableJoystick();
    }
  }

  // Método público para verificar se o joystick está ativo
  public isJoystickActive(): boolean {
    return this.isJoystickEnabled && this.joystick !== null;
  }

  private createMuteButton() {
    const cursorManager = CursorManager.getInstance();

    // Posição: Canto superior direito (margem de 20px)
    const x = this.scale.width - 40;
    const y = 40;

    // Cria o botão
    this.muteButton = this.add
      .sprite(x, y, "icon_sound_on")
      .setScale(2)
      .setInteractive({ useHandCursor: false }); // Desativa cursor do Phaser

    // Adiciona os eventos
    this.muteButton.on("pointerover", () => {
      cursorManager.setState("pointer");
    });

    this.muteButton.on("pointerout", () => {
      cursorManager.setState("default");
    });

    this.muteButton.on("pointerdown", () => {
      this.toggleMute();
    });
  }

  private toggleMute() {
    // Inverte o estado global de som do Phaser
    this.sound.mute = !this.sound.mute;

    // Atualiza textura
    const texture = this.sound.mute
      ? "icon_sound_off"
      : "icon_sound_on";
    this.muteButton.setTexture(texture);
  }

  private manageMusic() {
    // 1. Verifica/Cria a música
    if (!this.bgm) {
      if (this.sound.get("bgm_hub")) {
        this.bgm = this.sound.get("bgm_hub");
      } else {
        this.bgm = this.sound.add("bgm_hub", {
          volume: 0.05,
          loop: true,
        });
      }
    }

    // 2. Tenta tocar imediatamente
    if (!this.bgm.isPlaying && !this.sound.locked) {
      this.bgm.play();
    }

    const soundManager = this
      .sound as Phaser.Sound.WebAudioSoundManager;

    // 3. Lógica de Desbloqueio
    if (
      (soundManager.context &&
        soundManager.context.state === "suspended") ||
      this.sound.locked
    ) {
      const unlockAudio = () => {
        // Verifica se o context existe antes de tentar dar resume
        if (soundManager.context) {
          soundManager.context.resume().then(() => {
            if (!this.bgm.isPlaying) this.bgm.play();
          });
        } else {
          this.sound.unlock();
          if (!this.bgm.isPlaying) this.bgm.play();
        }

        // --- LIMPEZA ---
        // Remove listeners da Janela
        window.removeEventListener("keydown", unlockAudio, {
          capture: true,
        });
        window.removeEventListener(
          "pointerdown",
          unlockAudio,
          { capture: true }
        );
        window.removeEventListener(
          "touchstart",
          unlockAudio,
          { capture: true }
        );

        // Remove listeners do Phaser
        this.input.off("pointerdown", unlockAudio);
        if (this.input.keyboard) {
          this.input.keyboard.off("keydown", unlockAudio);
        }
      };

      // Adiciona listeners com capture: true
      const eventOptions = { capture: true, once: true };

      window.addEventListener(
        "keydown",
        unlockAudio,
        eventOptions
      );
      window.addEventListener(
        "pointerdown",
        unlockAudio,
        eventOptions
      );
      window.addEventListener(
        "touchstart",
        unlockAudio,
        eventOptions
      );

      // Redundância: Ouvinte interno do Phaser
      this.input.once("pointerdown", unlockAudio);
      if (this.input.keyboard) {
        this.input.keyboard.once("keydown", unlockAudio);
      }
    }
  }

  update() {
    // Atualiza a posição do joystick se a tela for redimensionada
    if (this.joystick && this.isJoystickEnabled) {
      (this.joystick as any).x = 100;
      (this.joystick as any).y = this.scale.height - 100;
    }
  }
}
