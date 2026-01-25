// scenes/IntroScene.ts
import { Scene } from "phaser";
import {
  IdCard,
  IdCardData,
} from "../../../entities/IdCard";
import { Planet } from "../../../entities/Planet";
import { AudioManager } from "../../../managers/AudioManager";
import { SettingsManager } from "../../../managers/SettingsManager";
import { TextManager } from "../../../managers/TextManager";
import { CursorManager } from "../../../systems/CursorManager";
import { SettingsMenu } from "../ui/components/SettingsMenu";
import { UIScene } from "../ui/UiScene";
import { CareerOptions } from "./components/CareerOptions";
import { CharacterWithAura } from "./components/CharacterWithAura";
import { CodeRainBackground } from "./components/CodeRainBackground";
import { DialogBox } from "../../ui/_DialogBox";
import { FaceFrame } from "./components/FaceFrame";
import { GenderOptions } from "./components/GenderOptions";
import { NameInput } from "./components/NameInput";
import { INTRO_CONFIG } from "./config/IntroConfig";
import { INTRO_STEPS } from "./config/IntroSteps";
import { AudioSystem } from "./systems/AudioSystem";
import { InputSystem } from "./systems/InputSystem";
import { TextTyper } from "./systems/TextTyper";
import {
  PlayerCareer,
  PlayerGender,
} from "./types/IntroTypes";
import { BudaDog } from "../../../entities/BudaDog";

export class IntroScene extends Scene {
  private currentStep = 0;
  private playerGender: PlayerGender = "nonbinary";
  private playerName = "";
  private canContinue = false;
  protected nameInputActive = false;

  // Systems
  private audio!: AudioSystem;
  private inputSystem!: InputSystem;
  private textTyper!: TextTyper;

  // Managers
  private settingsManager!: SettingsManager;
  private audioManager!: AudioManager;
  private textManager!: TextManager;
  private settingsMenu!: SettingsMenu;

  // Components
  private codeRainBackground!: CodeRainBackground;
  private dialogBox!: DialogBox;
  private characterWithAura!: CharacterWithAura;
  private faceFrame!: FaceFrame;
  private genderOptions!: GenderOptions;
  private nameInput: NameInput | null = null;

  // Game Objects
  private budaSprite!: Phaser.GameObjects.Sprite;
  private continuePrompt!: Phaser.GameObjects.Text;
  protected titleText!: Phaser.GameObjects.Text;

  private planet!: Planet;
  private budaDog!: BudaDog;

  private idCard!: IdCard;

  private careerOptions!: CareerOptions;
  private playerCareer: PlayerCareer | null = null;

  private uiScene!: UIScene;

  // UI Elements
  private settingsButton!: Phaser.GameObjects.Text;
  private questLogButton!: Phaser.GameObjects.Text;

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
    this.startIntroduction();

    // Configura atalhos de teclado
    this.setupKeyboardShortcuts();

    // Adiciona interação com o fundo
    this.setupBackgroundInteraction();
  }

  private initializeManagers(): void {
    // Inicializa SettingsManager
    this.settingsManager = SettingsManager.getInstance(
      this.game
    );

    // Cria AudioManager
    this.audioManager = new AudioManager(this);

    // Cria TextManager
    this.textManager = new TextManager(this);

    // Cria SettingsMenu (o mesmo usado em outras cenas)
    this.settingsMenu = new SettingsMenu(this);
  }

  private setupKeyboardShortcuts(): void {
    // ESC: Abre/fecha configurações
    this.input.keyboard?.on(
      "keydown-ESC",
      (event: KeyboardEvent) => {
        event.preventDefault();
        this.toggleSettingsMenu();
      }
    );

    // F11: Alterna tela cheia
    this.input.keyboard?.on(
      "keydown-F11",
      (event: KeyboardEvent) => {
        event.preventDefault();
        this.toggleFullscreen();
      }
    );

    // P: Pausa/Continua (para debug)
    this.input.keyboard?.on(
      "keydown-P",
      (event: KeyboardEvent) => {
        event.preventDefault();
        this.togglePause();
      }
    );
  }

  private toggleSettingsMenu(): void {
    // Alterna o menu de configurações
    this.settingsMenu.toggle();

    // Se o menu abriu, pausa a intro
    if (this.isSettingsMenuOpen()) {
      this.pauseIntro();
    } else {
      this.resumeIntro();
    }

    // Toca som apropriado
    // const soundName = this.isSettingsMenuOpen()
    //   ? "snd_open"
    //   : "snd_close";
    // this.audioManager.playSFX(soundName);
  }

  private isSettingsMenuOpen(): boolean {
    // Verifica se o menu está visível (você pode precisar adicionar um getter no SettingsMenu)
    // Se o SettingsMenu não tiver um método para verificar, podemos manter um estado local
    return (this.settingsMenu as any).isVisible === true;
  }

  private toggleFullscreen(): void {
    const currentFullscreen =
      this.settingsManager.getSettings().fullscreen;
    const newFullscreen = !currentFullscreen;

    // Atualiza configurações
    this.settingsManager.updateSettings({
      fullscreen: newFullscreen,
    });

    // Feedback visual
    this.showFullscreenFeedback(newFullscreen);

    // Toca som de feedback
    // this.audioManager.playSFX(
    //   newFullscreen ? "snd_confirm" : "snd_cancel"
    // );
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

    // Animação de entrada e saída
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
    // Alterna pausa (útil para debug)
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
    // Pausa elementos da intro quando o menu está aberto
    if (this.textTyper && this.textTyper.typing) {
      this.textTyper.pause();
    }

    // Desativa continuação
    this.canContinue = false;
    this.dialogBox.setHint("[ ESPAÇO para continuar ]");

    // Pausa animações
    this.tweens.pauseAll();
  }

  private resumeIntro(): void {
    // Retoma elementos da intro quando o menu fecha
    if (this.textTyper && this.textTyper.paused) {
      this.textTyper.resume();
    }

    // Reativa continuação se apropriado
    if (
      this.currentStep < INTRO_STEPS.length &&
      !this.nameInputActive
    ) {
      this.dialogBox.setContinueVisible(true);
      this.canContinue = true;
    }

    // Retoma animações
    this.tweens.resumeAll();
  }

  private initializeSystems(): void {
    this.audio = new AudioSystem(this);
    this.audio.setup();

    this.inputSystem = new InputSystem(this);
    this.inputSystem.setup();

    this.textTyper = new TextTyper(this, this.audio);
  }

  private initializeComponents(): void {
    this.codeRainBackground = new CodeRainBackground(this);
    this.codeRainBackground.create();

    this.dialogBox = new DialogBox(this, 550, 150);

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
    // Efeito de onda quando o Buda fala
    this.budaSprite.on("animationstart", () => {
      this.codeRainBackground.createShockwave(
        this.budaSprite.x,
        this.budaSprite.y - 50
      );
    });

    // Efeito de trail quando o mouse se move
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
      this.budaSprite
        .setX(
          this.scale.width / 2 -
            this.dialogBox.size.width / 2 -
            100
        )
        .setY(this.scale.height - 120);

      this.tweens.add({
        targets: this.budaSprite,
        alpha: 1,
        duration: 1000,
      });
    }, 100);
  }

  private startIntroduction(): void {
    // Toca música de fundo
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
          this.scale.height -
            this.dialogBox.size.height -
            this.planet.height / 2 -
            100,
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
          this.scale.height -
            this.dialogBox.size.height -
            this.budaDog.height / 2,
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
        // Limpa elementos da seleção de gênero anterior
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
        this.dialogBox.clearText();
        this.dialogBox.setHint("");

        this.createPlayerIdCard(); // O cartão aparece aqui

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
    this.createTitle("Selecione seu cargo");

    this.dialogBox.setHint(
      "[ Use SETAS para navegar e ENTER para selecionar ]"
    );
    this.canContinue = false;
    this.inputSystem.removeAllListeners();

    // Resetar seleção
    this.playerCareer = null;

    // Cria opções de carreira
    this.careerOptions = new CareerOptions(
      this,
      (careerId) =>
        this.selectCareer(careerId as PlayerCareer),
      (careerId) => this.onCareerHover(careerId)
    );

    this.careerOptions.create();
  }

  private onCareerHover(careerId: string): void {
    // Efeito sonoro
    this.audioManager.playSFX("snd_select");
  }

  private selectCareer(career: PlayerCareer): void {
    if (this.playerCareer !== null) return;

    this.playerCareer = career;
    this.registry.set("playerCareer", this.playerCareer);
    localStorage.setItem(
      "player_career",
      JSON.stringify(this.playerCareer)
    );

    this.audioManager.playSFX("snd_confirm");

    // Efeito visual
    this.codeRainBackground.createMatrixEffect(
      this.scale.width / 2,
      320
    );

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

    // this.continuePrompt.setY(this.scale.height - 80);
  }

  private showText(message: string): void {
    // 1. Mata qualquer processo de digitação que ainda esteja rodando
    this.textTyper.stop();

    // 2. Limpa o texto fisicamente no componente
    if (this.dialogBox["textContent"]) {
      (
        this.dialogBox[
          "textContent"
        ] as Phaser.GameObjects.Text
      ).setText("");
    }
    this.dialogBox.clearText();

    this.dialogBox.show(message);
    this.dialogBox.setHint("");
    this.budaSprite.setTexture("buda-talking");

    // 3. Inicia a nova digitação
    this.textTyper.typeText(
      this.dialogBox["textContent"],
      message,
      () => {
        this.budaSprite.setTexture("buda-idle");
        this.setupContinuePrompt();
      }
    );

    this.setupSkipLogic();
  }

  private setupSkipLogic(): void {
    this.inputSystem.removeAllListeners();

    const handleInput = () => {
      if (this.isSettingsMenuOpen()) return;

      if (this.textTyper && this.textTyper.typing) {
        // skipTyping agora chama o callback internamente e limpa tudo
        this.textTyper.skipTyping();
        this.budaSprite.setTexture("buda-idle");

        // Pequeno delay para evitar que o clique do skip avance o step
        this.time.delayedCall(50, () => {
          this.setupContinuePrompt();
        });
      }
    };

    this.inputSystem.onContinue(handleInput);
  }

  private setupContinuePrompt(): void {
    // Não ativa se menu de configurações estiver aberto
    if (this.isSettingsMenuOpen()) return;

    this.inputSystem.removeAllListeners();

    this.canContinue = true;

    this.dialogBox.setHint("[ ESPAÇO para continuar ]");

    const advance = () => {
      if (this.textTyper.typing) return;

      if (this.canContinue && !this.isSettingsMenuOpen()) {
        if (this.currentStep === 2) {
          this.showNameInput();
          return;
        }

        if (this.currentStep === 3) {
          this.showGenderSelection();
          return;
        }

        if (this.currentStep === 4) {
          this.showCareerSelection(); // Abre os cards após o espaço no Step 4
          return;
        }

        this.currentStep++;
        this.showStep();
      }
    };

    this.inputSystem.onContinue(advance);
  }

  private showNameInput(): void {
    // Não mostra input se menu estiver aberto
    if (this.isSettingsMenuOpen()) return;

    this.createTitle("Digite seu nome");

    this.dialogBox.setHint("[ ESPAÇO para continuar ]");
    this.canContinue = false;
    this.nameInputActive = true;

    this.inputSystem.removeAllListeners();

    this.nameInput = new NameInput(this, (name: string) => {
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

        this.input.keyboard?.resetKeys();
        this.game.canvas.focus();
        this.input.manager.enabled = true;

        this.currentStep = 3;
        this.showStep();
      });
    });

    this.nameInput.create();
  }

  private showGenderSelection(): void {
    // Não mostra se menu estiver aberto
    if (this.isSettingsMenuOpen()) return;

    this.dialogBox.setHint("[ ESPAÇO para continuar ]");
    this.canContinue = false;
    this.inputSystem.removeAllListeners();

    // Cria personagem com aura
    this.characterWithAura.create("nonbinary");
    this.characterWithAura.container
      .setPosition(this.scale.width / 2 - 75, 300)
      .setAlpha(0);

    this.createTitle("Selecione sua identidade de gênero");

    this.genderOptions = new GenderOptions(
      this,
      (gender) => this.selectGender(gender),
      (gender) => this.onGenderHover(gender)
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

    this.currentStep = 4;
    this.showStep();
  }

  private completeIntroduction(): void {
    // Salva dados do jogador
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

    // Limpa inputs
    if (this.nameInput) {
      this.nameInput.destroy();
      this.nameInput = null;
    }

    if (this.careerOptions) {
      this.careerOptions.destroy();
    }

    // Remove listeners de teclado
    this.input.keyboard?.off("keydown-ESC");
    this.input.keyboard?.off("keydown-F11");
    this.input.keyboard?.off("keydown-P");
  }

  private convertColorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  update(time: number, delta: number): void {
    // Atualizações por frame
    if (this.codeRainBackground) {
      this.codeRainBackground.update();
    }
  }

  // Adiciona getter para verificar se o menu está aberto (se não existir no SettingsMenu)
  public get isMenuOpen(): boolean {
    return (this.settingsMenu as any).isVisible === true;
  }
}
