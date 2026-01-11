import { Scene } from "phaser";
import { Building } from "../../../entities/Building";
import {
  IdCard,
  IdCardData,
} from "../../../entities/IdCard";
import { Planet } from "../../../entities/Planet";
import { CursorManager } from "../../../systems/CursorManager";
import { UIScene } from "../UiScene";
import { CareerOptions } from "./components/CareerOptions";
import { CharacterWithAura } from "./components/CharacterWithAura";
import { CodeRainBackground } from "./components/CodeRainBackground";
import { DialogBox } from "./components/DialogBpx";
import { FaceFrame } from "./components/FaceFrame";
import { GenderOptions } from "./components/GenderOptions";
import { NameInput } from "./components/NameInput";
import { INTRO_CONFIG } from "./config/IntroConfig";
import {
  INTRO_STEPS,
  getWelcomePronoun,
} from "./config/IntroSteps";
import { AudioSystem } from "./systems/AudioSystem";
import { InputSystem } from "./systems/InputSystem";
import { TextTyper } from "./systems/TextTyper";
import {
  PlayerCareer,
  PlayerGender,
} from "./types/IntroTypes";

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
  protected genderTitleText!: Phaser.GameObjects.Text;

  private cursorManager!: CursorManager;

  private planet!: Planet;
  private building!: Building;

  private idCard!: IdCard;

  private careerOptions!: CareerOptions;
  private playerCareer: PlayerCareer | null = null;

  private uiScene!: UIScene;

  constructor() {
    super("IntroScene");
  }

  create(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    // CRÍTICO: Obtém a instância do CursorManager
    this.cursorManager = CursorManager.getInstance();

    // PRIMEIRO: Desativa completamente o cursor do sistema
    this.input.setDefaultCursor("none");

    // Remove qualquer cursor CSS que possa estar atrapalhando
    this.forceHideSystemCursor();

    // SEGUNDO: Verifica se o CursorManager já foi inicializado
    if (!this.cursorManager.getCurrentScene()) {
      // Se não foi inicializado, inicializa com esta cena
      this.cursorManager.initialize(this);
    } else {
      // Se já foi inicializado, apenas atualiza a cena
      this.cursorManager.updateScene(this);
    }

    // TERCEIRO: Garante que o cursor customizado está ativo e visível
    this.cursorManager.setCustomCursorEnabled(true);
    this.cursorManager.setState("default");
    this.cursorManager.showCursor();

    // QUARTO: Corrige conflitos de cursor
    this.cursorManager.fixCursorConflict();

    console.log(
      "IntroScene - Estado do cursor:",
      this.cursorManager.getState()
    );

    // Desativa eventos de joystick
    this.game.events.emit("scene-changed", "IntroScene");
    this.game.events.emit("disable-joystick");

    this.initializeSystems();
    this.initializeComponents();
    this.createBudaSprite();
    this.createContinuePrompt();
    this.startIntroduction();

    // Adiciona interação com o fundo (opcional)
    this.setupBackgroundInteraction();
  }

  private forceHideSystemCursor(): void {
    // Método mais agressivo para garantir que o cursor do sistema fique escondido
    this.input.setDefaultCursor("none");

    // No HTML também
    document.body.style.cursor = "none";

    // Remove qualquer estilo anterior
    const existingStyle = document.getElementById(
      "cursor-fix-style"
    );
    if (existingStyle) {
      existingStyle.remove();
    }

    // Adiciona estilo para forçar cursor none em todos os elementos
    const style = document.createElement("style");
    style.id = "cursor-fix-style";
    style.innerHTML = `
      * {
        cursor: none !important;
      }
      
      canvas {
        cursor: none !important;
      }
      
      body {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);
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

    this.dialogBox = new DialogBox(this, {
      width: 550,
      height: 150,
    });

    this.characterWithAura = new CharacterWithAura(
      this,
      this.scale.width / 2 - 75,
      300
    );

    this.faceFrame = new FaceFrame(this);

    this.planet = new Planet(this, 0, 0, "planet");
    this.planet.setAlpha(0);
    this.building = new Building(this, 0, 0, "building");
    this.building.setAlpha(0);
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

        // IMPORTANTE: Atualiza a posição do cursor customizado
        if (this.cursorManager.isCustomCursorActive()) {
          // O próprio CursorManager já cuida disso, mas garantimos
          this.cursorManager.showCursor();
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

  private createContinuePrompt(): void {
    this.continuePrompt = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 35,
        "[ ESPAÇO para continuar ]",
        {
          ...INTRO_CONFIG.fonts.small,
          color: this.convertColorToString(
            INTRO_CONFIG.colors.highlight
          ),
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: { x: 20, y: 10 },
        }
      )
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(101);

    this.tweens.add({
      targets: this.continuePrompt,
      alpha: { from: 0.5, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      paused: true,
    });
  }

  private startIntroduction(): void {
    this.currentStep = 0;
    this.time.delayedCall(1000, () => {
      this.showStep();
    });
  }

  private showStep(): void {
    this.canContinue = false;
    this.inputSystem.removeAllListeners();

    // Reseta o cursor para estado padrão a cada step
    this.cursorManager.setState("default");

    switch (this.currentStep) {
      case 0:
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
      case 1:
        this.planet.hide(0);
        this.building.show(
          0.5,
          1,
          this.scale.width / 2,
          this.scale.height -
            this.dialogBox.size.height -
            this.planet.height / 2 -
            100,
          1
        );
        this.showText(INTRO_STEPS[1].text);
        break;
      case 2:
        this.building.hide(0);
        this.showText(INTRO_STEPS[2].text);
        break;
      case 3:
        this.showText(INTRO_STEPS[3].text);
        break;
      case 4: // Após seleção de gênero
        this.faceFrame.destroy();
        this.genderOptions.destroy();
        this.characterWithAura.destroy();
        this.genderTitleText.destroy();
        const genderText = `Perfeito! Agora, conte-nos sobre sua carreira.`;
        this.showText(genderText);
        break;
      case 5: // Seleção de cargo
        this.showCareerSelection();
        break;
      case 6:
        this.time.delayedCall(1000, () => {
          this.createPlayerIdCard();
        });
        const welcomeText = `Seja ${getWelcomePronoun(
          this.playerGender
        )}, ${
          this.playerName
        }!\nSeu crachá está pronto. Explore e descubra minha jornada!`;
        this.showText(welcomeText);
        break;
      case 7:
        if (this.idCard) {
          this.tweens.add({
            targets: this.idCard,
            scale: 1.2,
            alpha: 0,
            duration: 1000,
            ease: "Power3.out",
          });
        }
        this.completeIntroduction();
        break;
    }
  }

  private showCareerSelection(): void {
    this.continuePrompt.setVisible(false);
    this.canContinue = false;

    // Remove listeners de continuação
    this.inputSystem.removeAllListeners();

    // Garante que o cursor está configurado corretamente
    this.cursorManager.setState("default");
    this.cursorManager.showCursor();

    // Resetar estado de seleção
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
    // Efeito visual/sonoro ao passar o mouse
    this.audio.playSelect();

    // IMPORTANTE: Atualiza o cursor para estado "hover"
    this.cursorManager.setState("hover");
  }

  private selectCareer(career: PlayerCareer): void {
    if (this.playerCareer !== null) return; // Evitar seleções múltiplas

    this.playerCareer = career;
    this.audio.playConfirm();

    // Efeito visual
    this.codeRainBackground.createMatrixEffect(
      this.scale.width / 2,
      320
    );

    // Limpa e avança após delay
    this.time.delayedCall(1000, () => {
      this.careerOptions.destroy();
      this.currentStep = 6;
      this.showStep();
    });
  }

  private getCareerWelcomeText(): string {
    const careerTitles = {
      recruiter: "Recrutador(a) de Talentos",
      manager: "Gerente de Projetos",
      developer: "Desenvolvedor(a)",
      designer: "Designer Criativo(a)",
      analyst: "Analista de Sistemas",
      entrepreneur: "Empreendedor(a) Visionário(a)",
    };

    return (
      careerTitles[this.playerCareer!] || "Profissional"
    );
  }

  private createPlayerIdCard(): void {
    // A textura do rosto segue o padrão do FaceFrame
    const faceTexture = `${this.playerGender}-face`;

    // Dados para o IdCard
    const idCardData: IdCardData = {
      name: this.playerName,
      gender: this.playerGender,
      faceTexture: faceTexture,
      role: this.playerCareer,
    };

    // Posiciona o IdCard
    const x = this.scale.width / 2;
    const y = this.scale.height / 2;

    // Cria o IdCard
    this.idCard = new IdCard(this, x, y, idCardData);

    // Animação de entrada
    this.idCard.show();

    // Torna interativo
    this.idCard.makeInteractive();

    // Efeito de validação após 1 segundo
    this.time.delayedCall(1000, () => {
      this.idCard.playValidationEffect();
    });

    // Move o prompt de continuação para baixo do IdCard
    this.continuePrompt.setY(this.scale.height - 80);
  }

  private showText(message: string): void {
    this.dialogBox.show();
    this.dialogBox.clearText();
    this.continuePrompt.setVisible(false);

    this.budaSprite.setTexture("buda-talking");

    this.textTyper.typeText(
      this.dialogBox["textContent"], // Acessando membro privado via index
      message,
      () => {
        this.setupContinuePrompt();
        this.budaSprite.setTexture("buda-idle");
      }
    );
  }

  private setupContinuePrompt(): void {
    this.canContinue = true;
    this.continuePrompt.setVisible(true);
    this.tweens.resumeAll();

    const advance = () => {
      if (this.canContinue && !this.textTyper.typing) {
        this.currentStep++;

        if (this.currentStep === 3) {
          this.showNameInput();
          return;
        }

        if (this.currentStep === 4) {
          this.showGenderSelection();
          return;
        }

        this.showStep();
      }
    };

    this.inputSystem.onContinue(advance);
  }

  private showNameInput(): void {
    this.continuePrompt.setVisible(false);
    this.canContinue = false;
    this.nameInputActive = true;

    // Remove listeners de continuação
    this.inputSystem.removeAllListeners();

    // IMPORTANTE: Muda cursor para texto durante input
    this.cursorManager.setState("text");

    this.nameInput = new NameInput(this, (name: string) => {
      this.playerName = name.toUpperCase();
      this.audio.playConfirm();

      this.codeRainBackground.createMatrixEffect(
        this.scale.width / 2,
        320
      );

      this.time.delayedCall(800, () => {
        this.nameInput?.destroy();
        this.nameInput = null;
        this.currentStep = 3;
        this.showStep();

        // Volta para cursor padrão após input
        this.cursorManager.setState("default");
      });
    });

    this.nameInput.create();
  }

  private showGenderSelection(): void {
    this.continuePrompt.setVisible(false);
    this.canContinue = false;

    // Remove listeners de continuação
    this.inputSystem.removeAllListeners();

    // Configura cursor para seleção
    this.cursorManager.setState("default");
    this.cursorManager.showCursor();

    // Cria o personagem com aura
    this.characterWithAura.create("nonbinary");
    this.characterWithAura.container
      .setPosition(this.scale.width / 2 - 75, 300)
      .setAlpha(0);

    this.createGenderTitle();

    this.genderOptions = new GenderOptions(
      this,
      (gender) => this.selectGender(gender),
      (gender) => this.onGenderHover(gender)
    );

    this.genderOptions.create();
  }

  private createGenderTitle(): void {
    this.genderTitleText = this.add
      .text(
        this.scale.width / 2,
        36,
        "SELECIONE SUA IDENTIDADE DE GÊNERO",
        {
          ...INTRO_CONFIG.fonts.dialog,
          fontSize: "32px",
          color: this.convertColorToString(
            INTRO_CONFIG.colors.highlight
          ),
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: { x: 20, y: 10 },
        }
      )
      .setOrigin(0.5)
      .setDepth(25);
  }

  private onGenderHover(gender: PlayerGender): void {
    // Atualiza o personagem com o gênero selecionado
    this.characterWithAura.updateGender(gender);
    this.characterWithAura.container.setAlpha(1);

    // Atualiza o quadro de rosto
    this.faceFrame.show(gender);
    this.audio.playSelect();

    // IMPORTANTE: Atualiza o cursor para estado "hover"
    this.cursorManager.setState("hover");
  }

  private selectGender(gender: PlayerGender): void {
    this.audio.playConfirm();
    this.playerGender = gender;

    this.genderOptions.highlightSelected(gender);
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
    this.registry.set("playerName", this.playerName);
    this.registry.set("playerGender", this.playerGender);
    this.registry.set("playerCareer", this.playerCareer);
    this.registry.set("hasSeenIntro", true);
    this.registry.set(
      "playerSprite",
      `${this.playerGender}-run`
    );

    if (this.idCard) {
      // Salva dados do IdCard no registro
      this.registry.set("idCardData", {
        nome: this.playerName,
        genero: this.playerGender,
        faceTexture: `${this.playerGender}-face`,
      });

      // Efeito de zoom e fade out
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

    this.audio.fadeOutMusic();

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
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
    this.audio.stopMusic();
    this.tweens.killAll();
    this.time.removeAllEvents();

    // Limpa qualquer input
    if (this.nameInput) {
      this.nameInput.destroy();
      this.nameInput = null;
    }

    if (this.careerOptions) {
      this.careerOptions.destroy();
    }

    // Remove o estilo CSS que força cursor none
    const style = document.getElementById(
      "cursor-fix-style"
    );
    if (style) {
      style.remove();
    }

    // Restaura cursor padrão antes de sair
    this.cursorManager.setState("default");
  }

  private convertColorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }
}
