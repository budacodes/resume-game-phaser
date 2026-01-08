import { Scene } from "phaser";
import { PlayerGender } from "./types/IntroTypes";
import { INTRO_CONFIG } from "./config/IntroConfig";
import {
  INTRO_STEPS,
  getWelcomePronoun,
} from "./config/IntroSteps";
import { CharacterWithAura } from "./components/CharacterWithAura";
import { FaceFrame } from "./components/FaceFrame";
import { GenderOptions } from "./components/GenderOptions";
import { NameInput } from "./components/NameInput";
import { AudioSystem } from "./systems/AudioSystem";
import { InputSystem } from "./systems/InputSystem";
import { TextTyper } from "./systems/TextTyper";
import { DialogBox } from "./components/DialogBpx";
import { CodeRainBackground } from "./components/CodeRainBackground";

export class IntroScene extends Scene {
  private currentStep = 0;
  private playerGender: PlayerGender = "nonbinary";
  private playerName = "";
  private canContinue = false;
  private nameInputActive = false;

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
  private genderTitleText!: Phaser.GameObjects.Text;

  constructor() {
    super("IntroScene");
  }

  create(): void {
    this.initializeSystems();
    this.initializeComponents();
    this.createBudaSprite();
    this.createContinuePrompt();
    this.startIntroduction();

    // Adiciona interação com o fundo (opcional)
    this.setupBackgroundInteraction();
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

    this.dialogBox = new DialogBox(this);

    this.characterWithAura = new CharacterWithAura(
      this,
      this.scale.width / 2 - 75,
      300
    );

    this.faceFrame = new FaceFrame(this);
  }

  private setupBackgroundInteraction(): void {
    // Efeito de onda quando o Buda fala
    this.budaSprite.on("animationstart", () => {
      this.codeRainBackground.createShockwave(
        this.budaSprite.x,
        this.budaSprite.y - 50
      );
    });

    // Efeito de trail quando o mouse se move (opcional)
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
    const budaTexture = this.textures.exists("buda-idle")
      ? "buda-idle"
      : "bob-idle";

    this.budaSprite = this.add
      .sprite(100, this.scale.height - 100, budaTexture)
      .setScale(0.35)
      .setVisible(true);

    if (!this.anims.exists("buda-talk")) {
      this.anims.create({
        key: "buda-talk",
        frames: this.anims.generateFrameNumbers(
          budaTexture,
          {
            frames: [0, 1, 2, 1, 0, 3, 4, 3],
          }
        ),
        frameRate: 6,
        repeat: -1,
      });
    }
  }

  private createContinuePrompt(): void {
    this.continuePrompt = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 35,
        "[ ENTER para continuar ]",
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

    this.budaSprite.play("buda-talk");

    if (this.currentStep < INTRO_STEPS.length) {
      this.showText(INTRO_STEPS[this.currentStep].text);
    } else if (this.currentStep === 4) {
      const welcomeText = `Seja ${getWelcomePronoun(
        this.playerGender
      )}, ${
        this.playerName
      }!\nSeu crachá está pronto. Explore e descubra minha jornada!`;
      this.showText(welcomeText);
    } else if (this.currentStep === 5) {
      this.completeIntroduction();
    }
  }

  private showText(message: string): void {
    this.dialogBox.show();
    this.dialogBox.clearText();
    this.continuePrompt.setVisible(false);

    this.textTyper.typeText(
      this.dialogBox["textContent"], // Acessando membro privado via index
      message,
      () => this.setupContinuePrompt()
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

    this.nameInput = new NameInput(this, (name: string) => {
      this.playerName = name;
      this.audio.playConfirm();

      this.codeRainBackground.createMatrixEffect(
        this.scale.width / 2,
        320
      );

      this.createSparkleEffect(
        this.scale.width / 2,
        320,
        INTRO_CONFIG.colors.success
      );

      this.time.delayedCall(800, () => {
        this.nameInput?.destroy();
        this.nameInput = null;
        this.currentStep = 3;
        this.showStep();
      });
    });

    this.nameInput.create();
  }

  private showGenderSelection(): void {
    this.continuePrompt.setVisible(false);
    this.canContinue = false;

    // Cria o personagem com aura (posicionado à esquerda do quadro)
    this.characterWithAura.create("nonbinary");

    // Ajusta a posição do personagem para ficar à esquerda do quadro
    this.characterWithAura.container.setPosition(
      this.scale.width / 2 - 75, // 150px à esquerda do centro
      300
    );

    this.createGenderTitle();

    // Cria o quadro de rosto (no centro)
    this.faceFrame.create(
      "nonbinary",
      this.scale.width / 2,
      200
    );
    this.faceFrame.show("nonbinary");

    // Cria as opções de gênero
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
        36, // Posicionado mais acima para não atrapalhar
        "SELECIONE SUA IDENTIDADE DE GÊNERO",
        {
          ...INTRO_CONFIG.fonts.dialog,
          fontSize: "32px", // Um pouco menor
          color: this.convertColorToString(
            INTRO_CONFIG.colors.highlight
          ),
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: { x: 20, y: 10 },
        }
      )
      .setOrigin(0.5)
      .setDepth(25); // Depth alto para ficar acima de tudo
  }

  private onGenderHover(gender: PlayerGender): void {
    // Atualiza o personagem com o gênero selecionado
    this.characterWithAura.updateGender(gender);

    // Atualiza o quadro de rosto
    this.faceFrame.show(gender);
    this.audio.playSelect();
  }

  private selectGender(gender: PlayerGender): void {
    this.audio.playConfirm();
    this.playerGender = gender;

    this.genderOptions.highlightSelected(gender);

    this.characterWithAura.updateGender(gender);

    this.registry.set("playerSprite", `${gender}-run`);
    this.registry.set("playerSpriteFace", `${gender}-face`);

    this.createSparkleEffect(
      this.characterWithAura.container.x,
      this.characterWithAura.container.y,
      INTRO_CONFIG.colors[gender]
    );

    this.time.delayedCall(1500, () => {
      this.genderTitleText.destroy();
      this.genderOptions.destroy();
      this.characterWithAura.fadeOut();
      this.faceFrame.createParticles(
        this.scale.width / 2,
        200,
        gender
      );

      this.currentStep = 4;
      this.showStep();
    });
  }

  private completeIntroduction(): void {
    this.registry.set("playerName", this.playerName);
    this.registry.set("playerGender", this.playerGender);
    this.registry.set("hasSeenIntro", true);
    this.registry.set(
      "playerSprite",
      `${this.playerGender}-run`
    );

    this.cleanup();

    // Efeito final no background
    this.codeRainBackground.createShockwave(
      this.scale.width / 2,
      this.scale.height / 2
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
  }

  private createSparkleEffect(
    x: number,
    y: number,
    color: number
  ): void {
    for (let i = 0; i < 10; i++) {
      const angle = Phaser.Math.Between(0, 360);
      const speed = 100;
      const distance = speed;

      const particle = this.add.graphics({ x, y });
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 2);

      this.tweens.add({
        targets: particle,
        x:
          x +
          Math.cos(Phaser.Math.DegToRad(angle)) * distance,
        y:
          y +
          Math.sin(Phaser.Math.DegToRad(angle)) * distance,
        alpha: 0,
        scale: 3,
        duration: 6000,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private convertColorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }
}
