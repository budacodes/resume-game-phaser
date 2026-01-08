import { Scene } from "phaser";

export class IntroScene extends Scene {
  private currentStep = 0;
  private playerGender: "male" | "female" | "nonbinary" =
    "nonbinary";
  private playerName = "";
  private genderTitleText!: Phaser.GameObjects.Text;
  private budaSprite!: Phaser.GameObjects.Sprite;
  private playerPreviewSprite!: Phaser.GameObjects.Sprite;
  private textBox!: Phaser.GameObjects.Container;
  private textContent!: Phaser.GameObjects.Text;
  private continuePrompt!: Phaser.GameObjects.Text;
  private genderOptions: Phaser.GameObjects.Container[] =
    [];
  private nameInputActive = false;

  // NOVA PROPRIEDADE: Container para o personagem com aura
  private characterContainer!: Phaser.GameObjects.Container;

  private isTyping = false;
  private canContinue = false;
  private continueKey!: Phaser.Input.Keyboard.Key;

  private typeSounds: Phaser.Sound.BaseSound[] = [];
  private selectSound!: Phaser.Sound.BaseSound;
  private confirmSound!: Phaser.Sound.BaseSound;
  private errorSound!: Phaser.Sound.BaseSound;
  private bgMusic!: Phaser.Sound.BaseSound;

  private faceFrames: Map<
    string,
    Phaser.GameObjects.Container
  > = new Map();
  private currentFaceFrame: Phaser.GameObjects.Container | null =
    null;

  private readonly CONFIG = {
    colors: {
      background: 0x333333,
      textBox: 0x000000,
      text: 0xffffff,
      highlight: 0xffffff,
      budaGlow: 0x4cc9f0,
      male: 0x4a90e2,
      female: 0xe24a8e,
      nonbinary: 0x9b59b6,
      error: 0xff6b6b,
      success: 0x51cf66,
    },
    fonts: {
      title: {
        fontFamily: '"VT323"',
        fontSize: "36px",
      },
      dialog: { fontFamily: '"VT323"', fontSize: "24px" },
      input: { fontFamily: '"VT323"', fontSize: "24px" },
      small: { fontFamily: '"VT323"', fontSize: "16px" },
    },
  };

  constructor() {
    super("IntroScene");
  }

  private convertColorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  create() {
    console.log("=== DEBUG: Texturas carregadas ===");
    console.log(
      "male-face exists:",
      this.textures.exists("male-face")
    );
    console.log(
      "female-face exists:",
      this.textures.exists("female-face")
    );
    console.log(
      "nonbinary-face exists:",
      this.textures.exists("nonbinary-face")
    );
    console.log(
      "frame-gold exists:",
      this.textures.exists("frame-gold")
    );

    this.setupBackground();
    this.setupAudio();
    this.setupInput();
    this.createSprites();
    this.createTextBox();
    this.createContinuePrompt();
    this.startIntroduction();
  }

  private setupBackground() {
    const bg = this.add.graphics();
    bg.fillStyle(this.CONFIG.colors.background, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    this.createCodeGrid();
  }

  private createCodeGrid() {
    const codeChars = "01{}();:.=+-*/&|!?";
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, this.scale.width);
      const y = Phaser.Math.Between(0, this.scale.height);
      const char =
        codeChars[
          Math.floor(Math.random() * codeChars.length)
        ];

      this.add.text(x, y, char, {
        fontFamily: "VT323",
        fontSize: "14px",
        color: this.convertColorToString(
          this.CONFIG.colors.budaGlow
        ),
      });
    }
  }

  private setupAudio() {
    this.typeSounds = [
      this.sound.add("type_1", { volume: 0.1 }),
      this.sound.add("type_2", { volume: 0.5 }),
      this.sound.add("type_3", { volume: 0.2 }),
    ];

    this.selectSound = this.sound.add("snd_select", {
      volume: 0.4,
    });
    this.confirmSound = this.sound.add("snd_confirm", {
      volume: 0.5,
    });
    this.errorSound = this.sound.add("snd_error", {
      volume: 0.5,
    });
    this.bgMusic = this.sound.add("intro_music", {
      volume: 0.08,
      loop: true,
    });

    if (!this.sound.locked) {
      this.bgMusic.play();
    }
  }

  private setupInput() {
    if (this.input.keyboard) {
      this.continueKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.ENTER
      );
      this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
    }
  }

  private createSprites() {
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

    // Personagem inicial (será substituído pelo container na seleção de gênero)
    this.playerPreviewSprite = this.add
      .sprite(this.scale.width / 2 - 75, 300, "nonbinary-run")
      .setScale(3.5)
      .setAlpha(0)
      .setDepth(10);
  }

  private createTextBox() {
    const width = 600;
    const height = 150;
    const x = this.scale.width / 2;
    const y = this.scale.height - height / 2 - 15;

    this.textBox = this.add.container(x, y).setDepth(100);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.6);
    shadow.fillRoundedRect(
      -width / 2 + 4,
      -height / 2 + 4,
      width,
      height,
      12
    );

    const bg = this.add.graphics();
    bg.fillStyle(this.CONFIG.colors.textBox, 0.9);
    bg.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      12
    );
    bg.lineStyle(3, this.CONFIG.colors.highlight, 0.9);
    bg.strokeRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      12
    );

    this.textContent = this.add.text(
      -width / 2 + 25,
      -height / 2 + 40,
      "",
      {
        ...this.CONFIG.fonts.dialog,
        color: "#ffffff",
        wordWrap: { width: width - 50 },
        lineSpacing: 12,
      }
    );

    this.textBox.add([shadow, bg, this.textContent]);
    this.textBox.setVisible(false);
  }

  private createContinuePrompt() {
    this.continuePrompt = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 35,
        "[ ENTER para continuar ]",
        {
          ...this.CONFIG.fonts.small,
          color: this.convertColorToString(
            this.CONFIG.colors.highlight
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

  private createSparkleEffect(
    x: number,
    y: number,
    color: number
  ) {
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

  // NOVO MÉTODO: Cria o personagem com aura
  private setupCharacterWithAura(genderKey: string = "nonbinary") {
    // Remove container anterior se existir
    if (this.characterContainer) {
      this.characterContainer.destroy();
    }

    // Cria um novo container para agrupar personagem + aura
    this.characterContainer = this.add.container(
      this.scale.width / 2 - 75, // Mesma posição que você já usava
      300
    ).setDepth(10);

    const spriteKey = `${genderKey}-run`;

    // 1. Primeira camada: aura externa (mais fraca e maior)
    const outerAura = this.add.sprite(0, 0, spriteKey)
      .setScale(3.8) // Um pouco maior que o personagem
      .setTint(0xffffff) // Branco puro
      .setAlpha(0.15) // Muito transparente
      .setName('outerAura');

    // 2. Segunda camada: aura interna (um pouco mais forte)
    const innerAura = this.add.sprite(0, 0, spriteKey)
      .setScale(3.65) // Entre a aura externa e o personagem
      .setTint(0xffffff)
      .setAlpha(0.25)
      .setName('innerAura');

    // 3. Terceira camada: personagem principal
    const characterSprite = this.add.sprite(0, 0, spriteKey)
      .setScale(3.5) // Tamanho original do seu código
      .setAlpha(1)
      .setName('character');

    // Adiciona ao container na ordem correta (de trás para frente)
    this.characterContainer.add([outerAura, innerAura, characterSprite]);

    // Armazena o sprite principal para referência
    this.playerPreviewSprite = characterSprite;

    // Configura animações
    this.setupAuraAnimations(genderKey);

    return characterSprite;
  }

  // NOVO MÉTODO: Configura animações sincronizadas
  private setupAuraAnimations(genderKey: string) {
    const animationKey = `${genderKey}-running-down`;
    
    // Cria animação se não existir
    if (!this.anims.exists(animationKey)) {
      this.createIdleDownAnimation(`${genderKey}-run`, animationKey);
    }

    // Aplica animação a todas as camadas do container
    this.characterContainer.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Sprite) {
        child.play(animationKey, true);
      }
    });

    // Efeito de pulsação na aura
    const outerAura = this.characterContainer.getAt(0) as Phaser.GameObjects.Sprite;
    const innerAura = this.characterContainer.getAt(1) as Phaser.GameObjects.Sprite;

    if (outerAura && innerAura) {
      this.tweens.add({
        targets: outerAura,
        alpha: { from: 0.1, to: 0.2 },
        scale: { from: 3.75, to: 3.85 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: innerAura,
        alpha: { from: 0.2, to: 0.3 },
        scale: { from: 3.6, to: 3.7 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 500 // Desfase para criar efeito de onda
      });
    }
  }

  // NOVO MÉTODO: Atualiza a aura quando muda o gênero
  private updateCharacterAura(genderKey: string) {
    const spriteKey = `${genderKey}-run`;
    
    // Atualiza texturas de todas as camadas
    this.characterContainer.each((child: Phaser.GameObjects.GameObject, index: number) => {
      if (child instanceof Phaser.GameObjects.Sprite) {
        child.setTexture(spriteKey);
      }
    });

    // Atualiza animações
    this.setupAuraAnimations(genderKey);
  }

  private startIntroduction() {
    this.currentStep = 0;
    this.time.delayedCall(1000, () => {
      this.showStep();
    });
  }

  private showStep() {
    this.canContinue = false;
    this.isTyping = false;
    this.input.off("pointerdown");

    this.budaSprite.play("buda-talk");

    switch (this.currentStep) {
      case 0:
        this.showText(
          "Olá! Eu sou o Buda.\nEngenheiro Front-End e criador deste mundo."
        );
        break;
      case 1:
        this.showText(
          "Nele, cada prédio é uma parte da minha vida, cada interação um ponto a ser conhecido..."
        );
        break;
      case 2:
        this.showText(
          "Antes de começarmos nossa jornada,\ncomo você prefere ser chamado?"
        );
        break;
      case 3:
        this.showText(
          "Perfeito! E como você se identifica?"
        );
        break;
      case 4:
        let welcomePronoun = "";
        switch (this.playerGender) {
          case "male":
            welcomePronoun = "bem-vindo";
            break;
          case "female":
            welcomePronoun = "bem-vinda";
            break;
          case "nonbinary":
            welcomePronoun = "bem-vinde";
            break;
        }
        this.showText(
          `Seja ${welcomePronoun}, ${this.playerName}!\nSeu crachá está pronto. Explore e descubra minha jornada!`
        );
        break;
      case 5:
        this.completeIntroduction();
        break;
    }
  }

  private showText(message: string) {
    this.textBox.setVisible(true);
    this.textContent.setText("");
    this.continuePrompt.setVisible(false);

    this.isTyping = true;
    let charIndex = 0;

    let lastSoundTime = 0;
    const soundCooldown = 40;
    let soundCounter = 0;

    const timer = this.time.addEvent({
      delay: 30,
      callback: () => {
        this.textContent.setText(
          message.substring(0, charIndex)
        );
        charIndex++;

        const now = this.time.now;
        if (
          now - lastSoundTime > soundCooldown &&
          this.typeSounds.length > 0
        ) {
          const randomSound =
            this.typeSounds[
              soundCounter % this.typeSounds.length
            ];
          randomSound.play({
            rate: 0.85 + Math.random() * 0.3,
            volume: 0.05,
            detune: Math.random() * 200 - 100,
          });

          lastSoundTime = now;
          soundCounter++;
        }

        if (charIndex > message.length) {
          timer.remove();
          this.isTyping = false;
          this.setupContinuePrompt();
        }
      },
      callbackScope: this,
      repeat: message.length,
    });
  }

  private setupContinuePrompt() {
    this.canContinue = true;
    this.continuePrompt.setVisible(true);
    this.tweens.resumeAll();

    const advance = () => {
      if (this.canContinue && !this.isTyping) {
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

    this.continueKey?.removeAllListeners();
    this.continueKey?.on("down", advance);
    this.input.on("pointerdown", advance);
  }

  private showNameInput() {
    let canAcceptInput = false;
    this.time.delayedCall(300, () => {
      canAcceptInput = true;
    });

    this.continueKey?.removeAllListeners();
    this.input.off("pointerdown");
    this.input.keyboard?.removeAllListeners("keydown");

    this.continuePrompt.setVisible(false);
    this.canContinue = false;
    this.nameInputActive = true;

    const inputContainer = this.add.container(
      this.scale.width / 2,
      320
    );

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-200, -35, 400, 70, 15);
    bg.lineStyle(3, this.CONFIG.colors.highlight, 0.8);
    bg.strokeRoundedRect(-200, -35, 400, 70, 15);

    const inputText = this.add.text(
      -190,
      -20,
      "DIGITE SEU NOME",
      {
        ...this.CONFIG.fonts.input,
        color: "#888888",
      }
    );

    const cursor = this.add
      .text(-190, -20, "█", {
        ...this.CONFIG.fonts.input,
        color: this.convertColorToString(
          this.CONFIG.colors.highlight
        ),
      })
      .setVisible(false);

    const instruction = this.add
      .text(
        0,
        60,
        "(Mínimo 2 letras • Enter para confirmar)",
        {
          ...this.CONFIG.fonts.small,
          color: "#aaaaaa",
        }
      )
      .setOrigin(0.5);

    const errorMsg = this.add
      .text(0, 100, "Digite pelo menos 2 caracteres!", {
        ...this.CONFIG.fonts.small,
        color: this.convertColorToString(
          this.CONFIG.colors.error
        ),
      })
      .setOrigin(0.5)
      .setVisible(false);

    inputContainer.add([
      bg,
      inputText,
      cursor,
      instruction,
      errorMsg,
    ]);

    const cursorTween = this.tweens.add({
      targets: cursor,
      alpha: { from: 0, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    let name = "";

    const updateDisplay = () => {
      if (name.length === 0) {
        inputText
          .setText("DIGITE SEU NOME")
          .setColor("#888888");
        cursor.setVisible(false);
        cursorTween.pause();
      } else {
        inputText
          .setText(name.toUpperCase())
          .setColor("#ffffff");
        cursor.x = -190 + inputText.width + 2;
        cursor.setVisible(true);
        cursorTween.resume();
        errorMsg.setVisible(false);
      }
    };

    const handleInputKey = (event: KeyboardEvent) => {
      if (!this.nameInputActive || !canAcceptInput) return;

      if (event.key === "Enter") {
        if (name.length < 2) {
          this.errorSound.play();
          errorMsg.setVisible(true);

          this.tweens.add({
            targets: inputContainer,
            x: {
              from: inputContainer.x - 5,
              to: inputContainer.x + 5,
            },
            duration: 50,
            yoyo: true,
            repeat: 5,
            onComplete: () =>
              inputContainer.setX(this.scale.width / 2),
          });

          return;
        }

        this.input.keyboard?.off("keydown", handleInputKey);
        this.playerName = name.toUpperCase();
        this.nameInputActive = false;
        this.confirmSound.play({ volume: 0.4 });

        this.createSparkleEffect(
          inputContainer.x,
          inputContainer.y,
          this.CONFIG.colors.success
        );

        this.time.delayedCall(800, () => {
          cursorTween.stop();
          inputContainer.destroy();
          this.currentStep = 3;
          this.showStep();
        });
      } else if (event.key === "Backspace") {
        name = name.slice(0, -1);
        updateDisplay();
      } else if (
        event.key.length === 1 &&
        name.length < 15
      ) {
        if (/^[a-zA-ZÀ-ÿ\s'-]$/.test(event.key)) {
          name += event.key;
          updateDisplay();

          if (
            this.typeSounds.length > 0 &&
            name.length % 2 === 0
          ) {
            const randomSound =
              this.typeSounds[
                Math.floor(
                  Math.random() * this.typeSounds.length
                )
              ];
            randomSound.play({
              rate: 1.0 + Math.random() * 0.2,
              volume: 0.04,
            });
          }
        }
      }
    };

    this.input.keyboard?.on("keydown", handleInputKey);

    this.time.delayedCall(100, () => {
      this.tweens.add({
        targets: bg,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 150,
        yoyo: true,
        ease: "Sine.easeInOut",
      });

      updateDisplay();
    });

    updateDisplay();
  }

  private showGenderSelection() {
    this.continuePrompt.setVisible(false);
    this.canContinue = false;

    // Remove o sprite antigo se existir
    if (this.playerPreviewSprite && this.playerPreviewSprite.parentContainer !== this.characterContainer) {
      this.playerPreviewSprite.destroy();
    }

    // Cria o personagem com aura usando o método novo
    this.setupCharacterWithAura("nonbinary");

    this.genderTitleText = this.add
      .text(
        this.scale.width / 2,
        300,
        "SELECIONE SUA IDENTIDADE DE GÊNERO",
        {
          ...this.CONFIG.fonts.dialog,
          fontSize: "36px",
          color: this.convertColorToString(
            this.CONFIG.colors.highlight
          ),
        }
      )
      .setOrigin(0.5);

    const facesContainer = this.add.container(
      this.scale.width / 2,
      200
    );

    // Cria o quadro de rosto base
    this.createFaceFrame(
      "nonbinary",
      facesContainer.x,
      facesContainer.y
    );
    this.currentFaceFrame =
      this.faceFrames.get("nonbinary") || null;

    if (this.currentFaceFrame) {
      this.currentFaceFrame.setAlpha(1);
    }

    const options = [
      {
        key: "nonbinary",
        label: "NÃO-BINÁRIO",
        color: this.CONFIG.colors.nonbinary,
        icon: "⚧",
        sprite: "nonbinary-run",
        face: "nonbinary-face",
        animation: "nonbinary-running-down",
      },
      {
        key: "female",
        label: "FEMININO",
        color: this.CONFIG.colors.female,
        icon: "♀",
        sprite: "female-run",
        face: "female-face",
        animation: "female-running-down",
      },
      {
        key: "male",
        label: "MASCULINO",
        color: this.CONFIG.colors.male,
        icon: "♂",
        sprite: "male-run",
        face: "male-face",
        animation: "male-running-down",
      },
    ];

    const startX = this.scale.width / 2 - 200;
    const spacing = 200;

    options.forEach((option, index) => {
      const x = startX + spacing * index;
      const y = 420;

      const container = this.add.container(x, y);

      const card = this.add.graphics();
      card.fillStyle(option.color, 1);
      card.fillRoundedRect(-80, -70, 160, 140, 10);
      card.lineStyle(3, option.color, 0.8);
      card.strokeRoundedRect(-80, -70, 160, 140, 10);

      const icon = this.add
        .text(0, -35, option.icon, {
          fontFamily: "VT323",
          fontSize: "56px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      const label = this.add
        .text(0, 20, option.label, {
          ...this.CONFIG.fonts.dialog,
          fontSize: "20px",
          color: "#ffffff",
          align: "center",
          wordWrap: { width: 140 },
        })
        .setOrigin(0.5);

      container.add([card, icon, label]);

      container.setData("key", option.key);
      container.setData("card", card);
      container.setData("label", label);
      container.setData("icon", icon);
      container.setData("color", option.color);
      container.setData("animation", option.animation);
      container.setData("sprite", option.sprite);
      container.setData("face", option.face);

      card.setInteractive(
        new Phaser.Geom.Rectangle(-80, -70, 160, 140),
        Phaser.Geom.Rectangle.Contains
      );

      card.on("pointerover", () => {
        // Atualiza o personagem com aura para o gênero selecionado
        this.updateCharacterAura(option.key);

        if (!this.anims.exists(option.animation)) {
          this.createIdleDownAnimation(
            option.sprite,
            option.animation
          );
        }

        this.playerPreviewSprite.play(
          option.animation,
          true
        );

        this.updateFaceFrame(option.key, option.face);

        this.selectSound.play({ volume: 0.2 });

        this.tweens.add({
          targets: container,
          y: y - 10,
          duration: 200,
          ease: "Sine.easeOut",
        });
      });

      card.on("pointerout", () => {
        this.tweens.add({
          targets: container,
          y: y,
          duration: 200,
          ease: "Sine.easeOut",
        });
      });

      card.on("pointerdown", () => {
        this.selectGender(
          option.key as "male" | "female" | "nonbinary",
          container
        );
      });

      this.genderOptions.push(container);
    });

    if (!this.anims.exists("run-down")) {
      this.createIdleDownAnimation(
        "nonbinary-run",
        "run-down"
      );
    }

    // Inicia a animação
    this.playerPreviewSprite.play("nonbinary-running-down", true);
  }

  private createFaceFrame(
    genderKey: string,
    x: number,
    y: number
  ) {
    const container = this.add.container(x, y).setDepth(5);

    // Tamanho do quadro
    const frameWidth = 250;
    const frameHeight = 250;

    // *** PRIMEIRO: Adiciona o ROSTO (fundo) ***
    const faceTexture = `${genderKey}-face`;
    let faceElement: Phaser.GameObjects.GameObject;

    if (this.textures.exists(faceTexture)) {
      console.log(`Usando face texture: ${faceTexture}`);
      faceElement = this.add
        .sprite(0, 0, faceTexture)
        .setDisplaySize(200, 200)
        .setAlpha(1)
        .setDepth(0); // Depth baixo = atrás
    } else {
      console.log(
        `Face texture ${faceTexture} não encontrada. Usando fallback.`
      );
      const symbol =
        genderKey === "male"
          ? "♂"
          : genderKey === "female"
          ? "♀"
          : "⚧";
      faceElement = this.add
        .text(0, 0, symbol, {
          fontFamily: "VT323",
          fontSize: "100px",
          color: this.convertColorToString(
            this.CONFIG.colors[
              genderKey as keyof typeof this.CONFIG.colors
            ]
          ),
        })
        .setOrigin(0.5)
        .setAlpha(1)
        .setDepth(0);
    }

    // *** SEGUNDO: Adiciona a MOLDURA (por cima) ***
    let frameElement: Phaser.GameObjects.GameObject;

    if (this.textures.exists("frame-gold")) {
      console.log(
        `Usando imagem frame-gold para ${genderKey}`
      );
      frameElement = this.add
        .image(0, 0, "frame-gold")
        .setDisplaySize(frameWidth, frameHeight)
        .setAlpha(1)
        .setDepth(1); // Depth alto = na frente
    } else {
      console.log(
        `Criando frame programático para ${genderKey}`
      );
      const frameBg = this.add.graphics();

      // Cor baseada no gênero
      const color =
        this.CONFIG.colors[
          genderKey as keyof typeof this.CONFIG.colors
        ];

      // Fundo escuro (transparente para ver o rosto)
      frameBg.fillStyle(0x000000, 0.3);
      frameBg.fillRoundedRect(
        -frameWidth / 2,
        -frameHeight / 2,
        frameWidth,
        frameHeight,
        20
      );

      // Borda colorida
      frameBg.lineStyle(8, color, 1);
      frameBg.strokeRoundedRect(
        -frameWidth / 2,
        -frameHeight / 2,
        frameWidth,
        frameHeight,
        20
      );

      // Borda interna dourada
      frameBg.lineStyle(4, 0xffd700, 0.8);
      frameBg.strokeRoundedRect(
        -frameWidth / 2 + 5,
        -frameHeight / 2 + 5,
        frameWidth - 10,
        frameHeight - 10,
        15
      );

      frameElement = frameBg.setDepth(1);
    }

    // Adiciona PRIMEIRO o rosto, DEPOIS a moldura
    container.add(faceElement);
    container.add(frameElement);

    // Começa INVISÍVEL
    container.setAlpha(0);

    this.faceFrames.set(genderKey, container);
    return container;
  }

  // Método para atualizar o quadro de rosto
  private updateFaceFrame(
    genderKey: string,
    faceTexture: string
  ) {
    // Esconde o quadro atual
    if (this.currentFaceFrame) {
      this.tweens.add({
        targets: this.currentFaceFrame,
        alpha: 0,
        scale: 0.8,
        duration: 300,
        ease: "Sine.easeOut",
      });
    }

    // Mostra o novo quadro
    const newFrame = this.faceFrames.get(genderKey);
    if (newFrame) {
      // Agora o rosto está no índice 0 (primeiro elemento)
      const faceSprite = newFrame.getAt(
        0
      ) as Phaser.GameObjects.Sprite;
      if (faceSprite && this.textures.exists(faceTexture)) {
        faceSprite.setTexture(faceTexture);
      }

      // Animação de entrada
      newFrame.setAlpha(0);
      newFrame.setScale(0.8);

      this.tweens.add({
        targets: newFrame,
        alpha: 1,
        scale: 1,
        duration: 400,
        ease: "Back.easeOut",
      });

      // Efeito de partículas
      this.createFaceParticles(
        newFrame.x,
        newFrame.y,
        genderKey
      );

      this.currentFaceFrame = newFrame;
    } else {
      // Se não existe, cria um novo
      this.currentFaceFrame = this.createFaceFrame(
        genderKey,
        this.scale.width / 2,
        200
      );

      const faceSprite = this.currentFaceFrame.getAt(
        0
      ) as Phaser.GameObjects.Sprite;
      if (faceSprite) {
        faceSprite.setTexture(faceTexture);
      }

      this.tweens.add({
        targets: this.currentFaceFrame,
        alpha: 1,
        duration: 400,
        ease: "Sine.easeOut",
      });
    }
  }

  // Efeito de partículas para o quadro
  private createFaceParticles(
    x: number,
    y: number,
    genderKey: string
  ) {
    const color =
      this.CONFIG.colors[
        genderKey as keyof typeof this.CONFIG.colors
      ] || 0xffffff;

    for (let i = 0; i < 15; i++) {
      const angle = Phaser.Math.Between(0, 360);
      const distance = Phaser.Math.Between(80, 120);

      const particle = this.add.graphics({ x, y });
      particle.fillStyle(color, 0.8);
      particle.fillCircle(0, 0, Phaser.Math.Between(2, 4));

      this.tweens.add({
        targets: particle,
        x:
          x +
          Math.cos(Phaser.Math.DegToRad(angle)) * distance,
        y:
          y +
          Math.sin(Phaser.Math.DegToRad(angle)) * distance,
        alpha: 0,
        scale: 0,
        duration: 800,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createIdleDownAnimation(
    textureKey: string,
    animationKey: string
  ) {
    console.log(
      `Criando ${animationKey} para ${textureKey}`
    );

    // Define os frames baseado na sprite
    let startFrame = 0;
    let endFrame = 2;
    0;

    if (animationKey.includes("down")) {
      startFrame = 6;
      endFrame = 8;
    } else if (animationKey.includes("up")) {
      startFrame = 0;
      endFrame = 2;
    } else if (animationKey.includes("right")) {
      startFrame = 3;
      endFrame = 5;
    } else if (animationKey.includes("left")) {
      startFrame = 9;
      endFrame = 11;
    }

    this.anims.create({
      key: animationKey,
      frames: this.anims.generateFrameNumbers(textureKey, {
        start: startFrame,
        end: endFrame,
      }),
      frameRate: 6,
      repeat: -1,
    });
  }

  private selectGender(
    gender: "male" | "female" | "nonbinary",
    selectedContainer: Phaser.GameObjects.Container
  ) {
    this.confirmSound.play({ rate: 1.2, volume: 0.3 });
    this.playerGender = gender;

    this.genderOptions.forEach((container) => {
      const card = container.getData(
        "card"
      ) as Phaser.GameObjects.Graphics;
      const label = container.getData(
        "label"
      ) as Phaser.GameObjects.Text;
      const icon = container.getData(
        "icon"
      ) as Phaser.GameObjects.Text;
      const color = container.getData("color") as number;
      const isSelected = container === selectedContainer;
      const animation = container.getData(
        "animation"
      ) as string;
      const sprite = container.getData("sprite") as string;

      card.clear();

      if (isSelected) {
        card.fillStyle(color, 0.4);
        card.fillRoundedRect(-80, -70, 160, 140, 10);
        card.lineStyle(4, 0xffffff, 1);
        card.strokeRoundedRect(-80, -70, 160, 140, 10);
        label.setColor("#ffffff");
        icon.setColor("#ffffff");

        // Atualiza o personagem com aura para o gênero selecionado
        this.updateCharacterAura(gender);

        this.createSparkleEffect(
          container.x,
          container.y,
          color
        );

        this.tweens.add({
          targets: container,
          scale: { from: 1, to: 1.1 },
          duration: 200,
          yoyo: true,
        });
      } else {
        card.fillStyle(color, 0.1);
        card.fillRoundedRect(-80, -70, 160, 140, 10);
        card.lineStyle(2, 0x666666, 0.5);
        card.strokeRoundedRect(-80, -70, 160, 140, 10);
        label.setColor("#666666");
        icon.setColor("#666666");
      }
    });

    const selectedFace = selectedContainer.getData("face");
    const selectedSprite =
      selectedContainer.getData("sprite");

    this.registry.set("playerSprite", selectedSprite);
    this.registry.set("playerSpriteFace", selectedFace);

    // Efeito de confirmação no quadro de rosto
    if (this.currentFaceFrame) {
      this.tweens.add({
        targets: this.currentFaceFrame,
        scale: 1.1,
        duration: 200,
        yoyo: true,
        ease: "Sine.easeInOut",
      });

      // Brilho intenso na moldura
      const frameBorder = this.currentFaceFrame.getAt(
        1
      ) as Phaser.GameObjects.Graphics;
      if (frameBorder) {
        frameBorder.clear();
        const color = selectedContainer.getData("color");
        frameBorder.lineStyle(6, color, 1);
        frameBorder.strokeRoundedRect(
          -90,
          -90,
          180,
          180,
          20
        );
      }
    }

    this.time.delayedCall(1500, () => {
      if (this.genderTitleText) {
        this.genderTitleText.destroy();
      }
      this.genderOptions.forEach((opt) => opt.destroy());
      this.genderOptions = [];

      // Anima o container inteiro (personagem + aura) para desaparecer
      this.tweens.add({
        targets: this.characterContainer,
        alpha: 0,
        duration: 500,
      });

      this.currentStep = 4;
      this.showStep();
    });
  }

  private completeIntroduction() {
    this.registry.set("playerName", this.playerName);
    this.registry.set("playerGender", this.playerGender);
    this.registry.set("hasSeenIntro", true);

    let playerSprite = "";
    switch (this.playerGender) {
      case "male":
        playerSprite = "male-run";
        break;
      case "female":
        playerSprite = "female-run";
        break;
      case "nonbinary":
        playerSprite = "nonbinary-run";
        break;
    }

    this.registry.set("playerSprite", playerSprite);

    this.cleanup();

    this.cameras.main.fadeOut(2000, 0, 0, 0);

    this.tweens.add({
      targets: this.budaSprite,
      alpha: 0,
      duration: 1500,
    });

    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.tweens.add({
        targets: this.bgMusic,
        volume: 0,
        duration: 1500,
        onComplete: () => this.bgMusic.stop(),
      });
    }

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

  private cleanup() {
    this.continueKey?.removeAllListeners();
    this.input.keyboard?.removeAllListeners();
    this.input.off("pointerdown");

    if (this.bgMusic && this.bgMusic.isPlaying) {
      this.bgMusic.stop();
    }

    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}