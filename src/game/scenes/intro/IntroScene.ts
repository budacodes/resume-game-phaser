// scenes/IntroScene.ts
import { Scene } from "phaser";
import {
  IdCard,
  IdCardData,
} from "../../../entities/IdCard";
import { Planet } from "../../../entities/Planet";
import { AudioManager } from "../../../managers/AudioManager";
import { TextManager } from "../../../managers/TextManager";
import { SettingsMenu } from "../ui/components/SettingsMenu";
import { CareerOptions } from "./components/CareerOptions";
import { CharacterWithAura } from "./components/CharacterWithAura";
import { CodeRainBackground } from "./components/CodeRainBackground";
import { FaceFrame } from "./components/FaceFrame";
import { GenderOptions } from "./components/GenderOptions";
import { NameInput } from "./components/NameInput";
import { INTRO_CONFIG } from "./config/IntroConfig";
import { INTRO_STEPS } from "./config/IntroSteps";
import { AudioSystem } from "./systems/AudioSystem";
import { InputSystem } from "./systems/InputSystem";
import {
  PlayerCareer,
  PlayerGender,
} from "../../../config/types/IntroTypes";
import { BudaDog } from "../../../entities/BudaDog";
import { CursorPort } from "../../../application/ports/CursorPort";
import { SettingsPort } from "../../../application/ports/SettingsPort";
import { AudioManagerAdapter } from "../../../infrastructure/adapters/AudioManagerAdapter";
import { IntroSceneComposition } from "../../../composition/IntroSceneComposition";

export class IntroScene extends Scene {
  private currentStep = 0;
  private playerGender: PlayerGender = "nonbinary";
  private playerName = "";
  private canContinue = false;
  protected nameInputActive = false;

  // Systems
  private audio!: AudioSystem;
  private inputSystem!: InputSystem;

  // Managers
  private audioManager!: AudioManager;
  private textManager!: TextManager;
  private settingsMenu!: SettingsMenu;
  private settingsPort!: SettingsPort;
  private cursorPort!: CursorPort;

  // Components
  private codeRainBackground!: CodeRainBackground;
  private characterWithAura!: CharacterWithAura;
  private faceFrame!: FaceFrame;
  private genderOptions!: GenderOptions;
  private nameInput: NameInput | null = null;

  // Game Objects
  private budaSprite!: Phaser.GameObjects.Sprite;
  protected titleText!: Phaser.GameObjects.Text;

  private planet!: Planet;
  private budaDog!: BudaDog;

  private idCard!: IdCard;

  private careerOptions!: CareerOptions;
  private playerCareer: PlayerCareer | null = null;

  constructor() {
    super("IntroScene");
  }

  create(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    // Inicializa Managers
    this.initializeManagers();

    // Desativa eventos de joystick
    this.game.events.emit("scene-changed", "IntroScene");
    this.game.events.emit("disable-joystick");

    this.initializeSystems();
    this.initializeComponents();
    this.createBudaSprite();

    // Configura listeners de eventos da UIScene
    this.setupDialogListeners();

    this.startIntroduction();

    // Configura atalhos de teclado
    this.setupKeyboardShortcuts();

    // Adiciona interação com o fundo
    this.setupBackgroundInteraction();
  }

  private initializeManagers(): void {
    const composition = new IntroSceneComposition(
      this,
    ).build();
    this.audioManager = composition.audioManager;
    this.textManager = composition.textManager;
    this.settingsMenu = composition.settingsMenu;
    this.settingsPort = composition.settingsPort;
    this.cursorPort = composition.cursorPort;
  }

  private setupDialogListeners(): void {
    // Listener para quando a digitação terminar
    this.game.events.on(
      "intro-dialog-typing-finished",
      () => {
        this.onDialogTypingFinished();
      }
    );

    // Listener para quando o usuário apertar SPACE para continuar
    this.game.events.on("intro-dialog-continue", () => {
      this.onDialogContinue();
    });
  }

  private onDialogTypingFinished(): void {
    // Chamado quando a UIScene termina de digitar o texto
    this.budaSprite.setTexture("buda-idle");
    this.setupContinuePrompt();
  }

  private onDialogContinue(): void {
    // Chamado quando o usuário aperta SPACE para continuar
    if (!this.canContinue) return;
    if (this.nameInputActive) return;

    // Lógica específica de cada step
    if (this.currentStep === 2) {
      this.showNameInput();
      return;
    }

    if (this.currentStep === 3) {
      this.showGenderSelection();
      return;
    }

    if (this.currentStep === 4) {
      this.showCareerSelection();
      return;
    }

    // Avança para o próximo step
    this.currentStep++;
    this.showStep();
  }

  private setupKeyboardShortcuts(): void {
    this.input.keyboard?.on(
      "keydown-ESC",
      (event: KeyboardEvent) => {
        event.preventDefault();
        this.toggleSettingsMenu();
      }
    );

    this.input.keyboard?.on(
      "keydown-F11",
      (event: KeyboardEvent) => {
        event.preventDefault();
        this.toggleFullscreen();
      }
    );

    this.input.keyboard?.on(
      "keydown-P",
      (event: KeyboardEvent) => {
        event.preventDefault();
        this.togglePause();
      }
    );
  }

  private toggleSettingsMenu(): void {
    this.settingsMenu.toggle();

    if (this.isSettingsMenuOpen()) {
      this.pauseIntro();
    } else {
      this.resumeIntro();
    }
  }

  private isSettingsMenuOpen(): boolean {
    return (this.settingsMenu as any).isVisible === true;
  }

  private toggleFullscreen(): void {
    const currentFullscreen =
      this.settingsPort.getSettings().fullscreen;
    const newFullscreen = !currentFullscreen;

    this.settingsPort.updateSettings({
      fullscreen: newFullscreen,
    });

    this.showFullscreenFeedback(newFullscreen);
  }

  private showFullscreenFeedback(
    isFullscreen: boolean
  ): void {
    const message = isFullscreen
      ? "TELA CHEIA ATIVADA"
      : "TELA CHEIA DESATIVADA";
    const color = isFullscreen ? "#4caf50" : "#ff5555";

    const feedback = this.textManager
      .createText(this.scale.width / 2, 80, message, {
        fontSize: "24px",
        fontFamily: "'VT323'",
        color: color,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: { x: 20, y: 10 },
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    feedback.setDepth(1000);

    this.tweens.add({
      targets: feedback,
      y: 60,
      alpha: 1,
      duration: 300,
      ease: "Power2.out",
      onComplete: () => {
        this.tweens.add({
          targets: feedback,
          alpha: 0,
          y: 40,
          delay: 1000,
          duration: 500,
          ease: "Power2.in",
          onComplete: () => {
            feedback.destroy();
          },
        });
      },
    });
  }

  private togglePause(): void {
    if (this.scene.isPaused()) {
      this.scene.resume();
      this.showPauseFeedback("JOGO CONTINUADO");
    } else {
      this.scene.pause();
      this.showPauseFeedback("JOGO PAUSADO");
    }
  }

  private showPauseFeedback(message: string): void {
    const feedback = this.textManager
      .createText(
        this.scale.width / 2,
        this.scale.height / 2,
        message,
        {
          fontSize: "36px",
          fontFamily: "'VT323'",
          color: "#ff9900",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: { x: 30, y: 15 },
          stroke: "#000000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5);

    feedback.setDepth(1000);

    this.tweens.add({
      targets: feedback,
      alpha: 0,
      scale: 1.2,
      delay: 1000,
      duration: 500,
      ease: "Power2.in",
      onComplete: () => {
        feedback.destroy();
      },
    });
  }

  private pauseIntro(): void {
    // Pausa a digitação na UIScene
    this.game.events.emit("intro-pause-typing");

    this.canContinue = false;
    this.game.events.emit(
      "intro-set-hint",
      "[ ESPAÇO para continuar ]"
    );

    this.tweens.pauseAll();
  }

  private resumeIntro(): void {
    // Retoma a digitação na UIScene
    this.game.events.emit("intro-resume-typing");

    if (
      this.currentStep < INTRO_STEPS.length &&
      !this.nameInputActive
    ) {
      this.canContinue = true;
    }

    this.tweens.resumeAll();
  }

  private initializeSystems(): void {
    this.audio = new AudioSystem(this);
    this.audio.setup();

    this.inputSystem = new InputSystem(this);
    this.inputSystem.setup();
  }

  private initializeComponents(): void {
    this.codeRainBackground = new CodeRainBackground(this);
    this.codeRainBackground.create();

    this.characterWithAura = new CharacterWithAura(
      this,
      this.scale.width / 2 - 75,
      300
    );

    this.faceFrame = new FaceFrame(this);

    this.planet = new Planet(this, 0, 0, "planet");
    this.planet.setAlpha(0);
    this.budaDog = new BudaDog(this, 0, 0, "buda_dog");
    this.budaDog.setAlpha(0);
  }

  private setupBackgroundInteraction(): void {
    this.budaSprite.on("animationstart", () => {
      this.codeRainBackground.createShockwave(
        this.budaSprite.x,
        this.budaSprite.y - 50
      );
    });

    this.input.on(
      "pointermove",
      (pointer: Phaser.Input.Pointer) => {
        if (Math.random() < 0.3) {
          this.codeRainBackground.createTrail(
            pointer.x,
            pointer.y
          );
        }
      }
    );
  }

  private createBudaSprite(): void {
    const budaTexture = "buda-idle";

    this.budaSprite = this.add
      .sprite(0, 0, budaTexture)
      .setScale(0.35)
      .setAlpha(0);

    setTimeout(() => {
      // Posiciona o Buda na parte inferior esquerda
      this.budaSprite
        .setX(this.scale.width / 2 - 350) // Ajustado para dar espaço ao dialogBox
        .setY(this.scale.height - 120);

      this.tweens.add({
        targets: this.budaSprite,
        alpha: 1,
        duration: 1000,
      });
    }, 100);
  }

  private startIntroduction(): void {
    this.audioManager.playMusic("intro_music", {
      volume: 1,
    });

    this.currentStep = 0;
    this.time.delayedCall(1000, () => {
      this.showStep();
    });
  }

  private showStep(): void {
    if (this.isSettingsMenuOpen()) return;

    this.canContinue = false;
    this.inputSystem.removeAllListeners();

    switch (this.currentStep) {
      case 0: // Planeta
        this.planet.show(
          0.5,
          1,
          this.scale.width / 2,
          this.scale.height - this.planet.height / 2 - 250,
          1
        );
        this.showText(INTRO_STEPS[0].text);
        break;

      case 1: // Prédio
        this.planet.hide(0);

        this.budaDog.show(
          0.25,
          0.5,
          this.scale.width / 2,
          this.scale.height - this.planet.height / 2 - 250,
          1
        );
        this.showText(INTRO_STEPS[1].text);
        break;

      case 2: // Nome
        this.budaDog.hide(0);
        this.showText(INTRO_STEPS[2].text);
        break;

      case 3: // Gênero
        this.showText(INTRO_STEPS[3].text);
        this.titleText?.destroy();
        break;

      case 4: // Cargo (Apenas a pergunta)
        this.faceFrame.hideAll();
        this.genderOptions?.destroy();
        this.characterWithAura.destroy();
        this.titleText?.destroy();

        this.showText(INTRO_STEPS[4].text);
        break;

      case 5: // "Conexão estabelecida! Gerando sua chave..."
        this.titleText?.destroy();
        this.showText(INTRO_STEPS[5].text);
        break;

      case 6: // MOSTRAR O CARTÃO + MENSAGEM FINAL
        this.game.events.emit("intro-clear-dialog");

        this.createPlayerIdCard();

        this.time.delayedCall(2000, () => {
          this.showText(
            `Protocolos de acesso finalizados. A simulação está pronta para você, ${this.registry.get(
              "playerName"
            )}.\nIniciando sequência de boot... Aproveite a jornada!`
          );
        });
        break;

      case 7: // Finalização real (transição para MainScene)
        this.completeIntroduction();
        break;
    }
  }

  private showCareerSelection(): void {
    // Esconde o DialogBox durante a seleção
    this.game.events.emit("intro-hide-dialog");

    this.createTitle("Selecione seu cargo");

    this.game.events.emit("intro-set-hint", null);
    this.canContinue = false;
    this.inputSystem.removeAllListeners();

    // Reseta a seleção de carreira
    this.playerCareer = null;

    // Pequeno delay antes de criar as opções para evitar captura acidental de input
    this.time.delayedCall(100, () => {
      this.careerOptions = new CareerOptions(
        this,
        (careerId) =>
          this.selectCareer(careerId as PlayerCareer),
        (careerId) => this.onCareerHover(careerId),
        this.cursorPort,
      );

      this.careerOptions.create();
    });
  }

  private onCareerHover(careerId: string): void {
    void careerId;
    this.audioManager.playSFX("snd_select");
  }

  private selectCareer(career: PlayerCareer): void {
    // Previne seleção múltipla
    if (this.playerCareer !== null) return;

    this.playerCareer = career;
    this.registry.set("playerCareer", this.playerCareer);
    localStorage.setItem(
      "player_career",
      JSON.stringify(this.playerCareer)
    );

    this.audioManager.playSFX("snd_confirm");

    this.codeRainBackground.createMatrixEffect(
      this.scale.width / 2,
      320
    );

    // Remove listeners de teclado imediatamente
    this.input.keyboard?.removeAllListeners();

    // Limpa e avança
    this.time.delayedCall(1000, () => {
      this.careerOptions.destroy();
      this.currentStep = 5;
      this.showStep();
    });
  }

  private createPlayerIdCard(): void {
    const faceTexture = `${this.playerGender}-face`;
    const idCardData: IdCardData = {
      name: this.playerName,
      gender: this.playerGender,
      faceTexture: faceTexture,
      role: this.playerCareer,
    };

    const x = this.scale.width / 2;
    const y = this.scale.height / 2;

    this.idCard = new IdCard(this, x, y, idCardData);
    this.idCard.show();
    this.idCard.makeInteractive();

    this.time.delayedCall(1000, () => {
      this.idCard.playValidationEffect();
    });
  }

  private showText(message: string): void {
    // Limpa o texto anterior via UIScene
    this.game.events.emit("intro-clear-dialog");

    // Muda sprite do Buda para "falando"
    this.budaSprite.setTexture("buda-talking");

    // Envia evento para UIScene mostrar o diálogo com digitação
    this.game.events.emit("intro-show-dialog", {
      text: message,
      hint: "",
    });
  }

  private setupContinuePrompt(): void {
    if (this.isSettingsMenuOpen()) return;

    this.inputSystem.removeAllListeners();

    this.canContinue = true;

    // Atualiza o hint via UIScene
    this.game.events.emit(
      "intro-set-hint",
      "[ ESPAÇO para continuar ]"
    );
  }

  private showNameInput(): void {
    if (this.isSettingsMenuOpen()) return;

    // Esconde o DialogBox durante o input
    this.game.events.emit("intro-hide-dialog");

    this.createTitle("Digite seu nome");

    // Limpa o hint durante o input
    this.game.events.emit("intro-set-hint", null);
    this.canContinue = false;
    this.nameInputActive = true;

    this.inputSystem.removeAllListeners();

    this.nameInput = new NameInput(
      this,
      (name: string) => {
        this.playerName = name.toUpperCase();
        this.audioManager.playSFX("snd_confirm");
        this.registry.set("playerName", this.playerName);
        localStorage.setItem(
          "player_name",
          JSON.stringify(this.playerName)
        );

        this.codeRainBackground.createMatrixEffect(
          this.scale.width / 2,
          320
        );

        this.time.delayedCall(800, () => {
          this.nameInput?.destroy();
          this.nameInput = null;
          this.nameInputActive = false;

          this.input.keyboard?.resetKeys();
          this.game.canvas.focus();
          this.input.manager.enabled = true;

          this.currentStep = 3;
          this.showStep();
        });
      },
      new AudioManagerAdapter(this.audioManager),
    );

    this.nameInput.create();
  }

  private showGenderSelection(): void {
    if (this.isSettingsMenuOpen()) return;

    // Esconde o DialogBox durante a seleção
    this.game.events.emit("intro-hide-dialog");

    // Limpa o hint pois agora estamos em seleção interativa
    this.game.events.emit("intro-set-hint", null);
    this.canContinue = false;
    this.inputSystem.removeAllListeners();

    this.characterWithAura.create("nonbinary");
    this.characterWithAura.container
      .setPosition(this.scale.width / 2 - 75, 300)
      .setAlpha(0);

    this.createTitle("Selecione sua identidade de gênero");

    this.genderOptions = new GenderOptions(
      this,
      (gender) => this.selectGender(gender),
      (gender) => this.onGenderHover(gender),
      this.cursorPort,
    );

    this.genderOptions?.create();
  }

  private createTitle(title: string): void {
    this.titleText?.destroy();

    this.titleText = this.textManager
      .createText(
        this.scale.width / 2,
        36,
        title.toUpperCase(),
        {
          fontFamily: INTRO_CONFIG.fonts.title.fontFamily,
          fontSize: INTRO_CONFIG.fonts.title.fontSize,
          color: this.convertColorToString(
            INTRO_CONFIG.colors.title
          ),
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: { x: 20, y: 10 },
          align: "center",
          stroke: "#000000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5)
      .setDepth(25);
  }

  private onGenderHover(gender: PlayerGender): void {
    this.characterWithAura.updateGender(gender);
    this.characterWithAura.container.setAlpha(1);
    this.faceFrame.show(gender);
    this.audioManager.playSFX("snd_select");
  }

  private selectGender(gender: PlayerGender): void {
    this.audioManager.playSFX("snd_confirm");
    this.playerGender = gender;
    this.registry.set("playerGender", this.playerGender);
    localStorage.setItem(
      "player_gender",
      JSON.stringify(this.playerGender)
    );

    this.genderOptions?.highlightSelected(gender);
    this.characterWithAura.updateGender(gender);

    this.registry.set("playerSprite", `${gender}-run`);
    this.registry.set("playerSpriteFace", `${gender}-face`);

    this.codeRainBackground.createMatrixEffect(
      this.scale.width / 2,
      320
    );

    // Remove listeners de teclado antes de avançar
    this.input.keyboard?.removeAllListeners();

    // Aguarda um momento antes de avançar
    this.time.delayedCall(1000, () => {
      this.currentStep = 4;
      this.showStep();
    });
  }

  private completeIntroduction(): void {
    this.registry.set(
      "playerSprite",
      `${this.playerGender}-run`
    );

    if (this.idCard) {
      this.registry.set("idCardData", {
        name: this.playerName,
        gender: this.playerGender,
        faceTexture: `${this.playerGender}-face`,
      });

      this.tweens.add({
        targets: this.idCard,
        scale: 1.3,
        alpha: 0,
        duration: 800,
        ease: "Power3.out",
        onComplete: () => {
          if (this.idCard) {
            this.idCard.destroy();
          }
        },
      });
    }

    // Esconde o DialogBox antes de fazer a transição
    this.game.events.emit("intro-hide-dialog");

    // Muda o modo do dialog para MainScene
    this.game.events.emit("set-dialog-mode", "read");

    this.cleanup();

    this.codeRainBackground.createMatrixEffect(
      this.scale.width / 2,
      320
    );

    this.cameras.main.fadeOut(2000, 0, 0, 0);

    this.tweens.add({
      targets: this.budaSprite,
      alpha: 0,
      duration: 1500,
    });

    this.audioManager.fadeOutMusic();

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.stop("IntroScene");
        this.scene.resume("UIScene");

        this.scene.start("MainScene", {
          mapKey: "hub",
          spawnName: "spawn_start",
          facingDirection: "down",
        });
      }
    );
  }

  private cleanup(): void {
    this.inputSystem.removeAllListeners();
    this.audioManager.stopMusic();
    this.tweens.killAll();
    this.time.removeAllEvents();

    if (this.nameInput) {
      this.nameInput.destroy();
      this.nameInput = null;
    }

    if (this.careerOptions) {
      this.careerOptions.destroy();
    }

    // Remove listeners de eventos
    this.game.events.off("intro-dialog-typing-finished");
    this.game.events.off("intro-dialog-continue");

    // Remove listeners de teclado
    this.input.keyboard?.off("keydown-ESC");
    this.input.keyboard?.off("keydown-F11");
    this.input.keyboard?.off("keydown-P");
  }

  private convertColorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  update(time: number, delta: number): void {
    void time;
    void delta;
    if (this.codeRainBackground) {
      this.codeRainBackground.update();
    }
  }

  public get isMenuOpen(): boolean {
    return (this.settingsMenu as any).isVisible === true;
  }
}
