import Phaser from "phaser";
import { CursorPort } from "../../../../application/ports/CursorPort";
import { CursorManager } from "../../../../managers/CursorManager";
import { CursorManagerAdapter } from "../../../../infrastructure/adapters/CursorManagerAdapter";
import { SettingsManager } from "../../../../managers/SettingsManager";
import { SettingsPort } from "../../../../application/ports/SettingsPort";
import { SettingsManagerAdapter } from "../../../../infrastructure/adapters/SettingsManagerAdapter";
import { COLORS } from "../Utils";

export class SettingsMenu {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private opened = false;

  public isVisible = false;

  private readonly panelWidth = 520;
  private readonly panelPadding = 24;
  private readonly rowHeight = 44;
  private readonly sliderWidth = 240;

  private cursorManager!: CursorPort;
  private settingsPort!: SettingsPort;

  // Configurações
  private settings = {
    masterVolume: 1.0,
    musicVolume: 1.0,
    sfxVolume: 1.0,
    uiScale: 1.0,
    fontSize: 0.5,
    language: "PT-BR",
    fullscreen: false,
  };

  constructor(
    scene: Phaser.Scene,
    cursor?: CursorPort,
    settingsPort?: SettingsPort,
  ) {
    this.scene = scene;

    const manager = SettingsManager.getInstance(
      this.scene.game,
    );
    this.settingsPort =
      settingsPort ?? new SettingsManagerAdapter(manager);

    const saved = this.settingsPort.getSettings();
    this.settings = { ...saved }; // Clona os valores para o menu

    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);
    this.container.setVisible(false);
    this.container.setScrollFactor(0);

    this.cursorManager =
      cursor ??
      new CursorManagerAdapter(CursorManager.getInstance());

    this.create();
  }

  // ======================================================
  // PUBLIC API (contrato usado pelas outras cenas)
  // ======================================================

  public open(): void {
    if (this.isVisible) return;

    this.isVisible = true;

    // 1. Atualiza dados antes de mostrar
    this.updateLocalSettingsFromManager();

    // 2. Reconstrói UI com valores atualizados
    this.container.removeAll(true);
    this.create();

    // 3. Cursor sempre correto
    this.cursorManager.setScene(this.scene);
    this.cursorManager.showCursor();

    // 4. Mostra container
    this.container.setVisible(true);
  }

  public close(): void {
    if (!this.isVisible) return;

    this.isVisible = false;

    // Opcional: limpar foco / estados internos aqui

    this.container.setVisible(false);
  }

  public isOpen(): boolean {
    return this.opened;
  }

  public toggle(): void {
    this.isVisible ? this.close() : this.open();
  }

  public destroy(): void {
    this.container.destroy(true);
  }

  // ======================================================
  // BUILD
  // ======================================================

  private create(): void {
    const { width, height } = this.scene.scale;

    let scaleToApply = this.settings.uiScale;

    if (isNaN(scaleToApply) || scaleToApply <= 0) {
      scaleToApply = 1.0; // Fallback para o normal
    }

    this.container.setPosition(width / 2, height / 2);

    // 2. Aplica a escala com segurança
    this.container.setScale(scaleToApply);

    // 3. O OVERLAY deve ter um detalhe importante:
    // Como o container está escalado, o overlay dentro dele também será.
    // Se o container está em 1.5x, o overlay de tamanho 'width' ficará gigante.
    // SOLUÇÃO: O overlay deve ser dividido pela escala para sempre cobrir a tela exata.
    const overlay = this.scene.add.rectangle(
      0,
      0,
      width / scaleToApply,
      height / scaleToApply,
      0x000000,
      0.7,
    );
    overlay.setOrigin(0.5);
    overlay.setInteractive();

    // Clicar no overlay fecha o menu
    overlay.on("pointerdown", () => {
      this.toggle();
    });

    this.container.add(overlay);

    // ===== PAINEL DE FUNDO (opaco)
    const background = this.scene.add.rectangle(
      0,
      0,
      this.panelWidth,
      520,
      0x0b0b0b,
      0.95,
    );
    background.setStrokeStyle(2, 0xffffff, 1);
    background.setOrigin(0.5);
    background.setInteractive();

    this.container.add(background);

    // ===== TÍTULO
    const title = this.scene.add
      .text(0, -220, "CONFIGURAÇÕES", {
        fontFamily: "'VT323'",
        fontSize: "32px",
        color: `#${COLORS.gold}`,
      })
      .setOrigin(0.5);

    this.container.add(title);

    // ===== BOTÃO FECHAR (X)
    const closeButton = this.scene.add
      .sprite(this.panelWidth / 2 - 32, -224, "close")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false })
      .setScale(2);

    closeButton.on("pointerover", () => {
      this.cursorManager.setState("hover");
      closeButton.setTintFill(+`0x${COLORS.red}`);
    });

    closeButton.on("pointerout", () => {
      this.cursorManager.setState("default");
      closeButton.setTintFill(0xffffff);
    });

    closeButton.on("pointerdown", () => {
      this.toggle();
    });

    this.container.add(closeButton);

    let cursorY = -160;

    // ===== IDIOMA
    this.addLabel(
      "Idioma:",
      -this.panelWidth / 2 + this.panelPadding,
      cursorY,
    );

    const langButtonX = -42;
    const langButton = this.scene.add
      .rectangle(langButtonX, cursorY, 80, 26, 0x6b6b6b)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false });

    const langText = this.scene.add
      .text(langButtonX, cursorY, this.settings.language, {
        fontFamily: "'VT323'",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Interatividade do botão de idioma
    langButton.on("pointerover", () => {
      langButton.setFillStyle(0x8b8b8b);
      this.cursorManager.setState("hover");
    });
    langButton.on("pointerout", () => {
      langButton.setFillStyle(0x6b6b6b);
      this.cursorManager.setState("default");
    });
    langButton.on("pointerdown", () => {
      // Alternar entre idiomas
      this.settings.language =
        this.settings.language === "PT-BR"
          ? "EN-US"
          : "PT-BR";
      langText.setText(this.settings.language);
    });

    this.container.add([langButton, langText]);

    cursorY += this.rowHeight;

    // ===== SLIDERS
    this.addSliderRow(
      "Volume Geral:",
      cursorY,
      "masterVolume",
    );
    cursorY += this.rowHeight;

    this.addSliderRow(
      "Volume da Música:",
      cursorY,
      "musicVolume",
    );
    cursorY += this.rowHeight;

    this.addSliderRow(
      "Volume dos Efeitos:",
      cursorY,
      "sfxVolume",
    );
    cursorY += this.rowHeight;

    // ===== INSTRUÇÕES
    const instructionsTitle = this.scene.add
      .text(0, cursorY, "INSTRUÇÕES", {
        fontFamily: "'VT323'",
        fontSize: "32px",
        color: `#${COLORS.gold}`,
      })
      .setOrigin(0.5);

    this.container.add(instructionsTitle);
    cursorY += this.rowHeight;

    const btnE = this.scene.add
      .sprite(
        -this.panelWidth / 2 + this.panelPadding * 1.5,
        cursorY,
        "keys",
        20,
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false })
      .setScale(2);
    this.container.add(btnE);

    const btnEInstruction = this.scene.add
      .text(
        -this.panelWidth / 2 + 56,
        cursorY - 12,
        "Interagir com objetos",
        {
          fontFamily: "'VT323'",
          fontSize: "20px",
          color: `#FFFFFF`,
        },
      )
      .setOrigin(0);
    this.container.add(btnEInstruction);
    cursorY += this.rowHeight;

    const btnI = this.scene.add
      .sprite(
        -this.panelWidth / 2 + this.panelPadding * 1.5,
        cursorY,
        "keys",
        24,
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false })
      .setScale(2);
    this.container.add(btnI);

    const btnIInstruction = this.scene.add
      .text(
        -this.panelWidth / 2 + 56,
        cursorY - 12,
        "Abrir inventário",
        {
          fontFamily: "'VT323'",
          fontSize: "20px",
          color: `#FFFFFF`,
        },
      )
      .setOrigin(0);

    this.container.add(btnIInstruction);

    cursorY += this.rowHeight;

    const btnQ = this.scene.add
      .sprite(
        -this.panelWidth / 2 + this.panelPadding * 1.5,
        cursorY,
        "keys",
        32,
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false })
      .setScale(2);
    this.container.add(btnQ);

    const btnQInstruction = this.scene.add
      .text(
        -this.panelWidth / 2 + 56,
        cursorY - 12,
        "Abrir Diário de Missões",
        {
          fontFamily: "'VT323'",
          fontSize: "20px",
          color: `#FFFFFF`,
        },
      )
      .setOrigin(0);

    this.container.add(btnQInstruction);

    cursorY += this.rowHeight;

    const btnEsc = this.scene.add
      .sprite(
        -this.panelWidth / 2 + this.panelPadding * 1.5,
        cursorY,
        "special_keys",
        1,
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false })
      .setScale(2);
    this.container.add(btnEsc);

    const btnEscInstruction = this.scene.add
      .text(
        -this.panelWidth / 2 + 56,
        cursorY - 12,
        "Abrir Menu de Configurações",
        {
          fontFamily: "'VT323'",
          fontSize: "20px",
          color: `#FFFFFF`,
        },
      )
      .setOrigin(0);

    this.container.add(btnEscInstruction);

    cursorY += this.rowHeight;

    // this.addSliderRow("Escala da UI:", cursorY, "uiScale");
    // cursorY += this.rowHeight;

    // this.addFontSizeRow(cursorY);
    // cursorY += this.rowHeight + 10;

    // // ===== TELA CHEIA
    // this.addLabel(
    //   "Tela Cheia:",
    //   -this.panelWidth / 2 + this.panelPadding,
    //   cursorY,
    // );

    // const toggleX = -68;
    // const fullscreenToggle = this.scene.add
    //   .sprite(toggleX, cursorY, "expand")
    //   // .rectangle(toggleX, cursorY, 24, 14, 0xff4d4d)
    //   .setOrigin(0.5)
    //   .setScale(2)
    //   .setInteractive({ useHandCursor: false });

    // // Interatividade do toggle de tela cheia
    // fullscreenToggle.on("pointerdown", () => {
    //   this.settings.fullscreen = !this.settings.fullscreen;
    //   // fullscreenToggle.setFillStyle(
    //   //   this.settings.fullscreen ? 0x4dff4d : 0xff4d4d
    //   // );
    //   fullscreenToggle.setTexture(
    //     this.settings.fullscreen ? "minimize" : "expand",
    //   );

    //   if (this.settings.fullscreen) {
    //     this.scene.scale.startFullscreen();
    //   } else {
    //     this.scene.scale.stopFullscreen();
    //   }
    // });

    // fullscreenToggle.on("pointerover", () => {
    //   this.cursorManager.setState("hover");
    //   fullscreenToggle.setTintFill(+`0x${COLORS.gold}`);
    // });

    // fullscreenToggle.on("pointerout", () => {
    //   this.cursorManager.setState("default");
    //   fullscreenToggle.setTintFill(0xffffff);
    // });

    // this.container.add(fullscreenToggle);

    // cursorY += 56;

    // ===== BOTÃO APLICAR
    const applyButton = this.scene.add
      .rectangle(0, cursorY, 160, 40, +`0x${COLORS.gold}`)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false });

    const applyText = this.scene.add
      .text(0, cursorY, "APLICAR", {
        fontFamily: "'VT323'",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Interatividade do botão aplicar
    applyButton.on("pointerover", () => {
      applyButton.setFillStyle(0xd37e00);
    });
    applyButton.on("pointerout", () => {
      applyButton.setFillStyle(+`#${COLORS.gold}`);
    });
    applyButton.on("pointerdown", () => {
      applyButton.setFillStyle(0xe38a02);
      this.applySettings();
    });
    applyButton.on("pointerup", () => {
      applyButton.setFillStyle(0xd37e00);
    });

    this.container.add([applyButton, applyText]);
  }

  // ======================================================
  // HELPERS
  // ======================================================

  private addLabel(
    text: string,
    x: number,
    y: number,
  ): void {
    const baseSize = 16;
    // O fontSize no seu settings é um multiplicador (0.5, 1.0, 1.5)
    const fontSizeMultiplier = this.settings.fontSize;
    const finalSize = Math.round(
      baseSize * (fontSizeMultiplier * 2),
    ); // Ajuste o cálculo conforme desejar

    const label = this.scene.add
      .text(x, y, text, {
        fontFamily: "'VT323'",
        fontSize: `${finalSize}px`,
        color: "#ffffff",
      })
      .setOrigin(0, 0.5);

    this.container.add(label);
  }

  private addSliderRow(
    label: string,
    y: number,
    settingKey: keyof typeof this.settings,
  ): void {
    const labelX = -this.panelWidth / 2 + this.panelPadding;
    const sliderX = 40;
    const valueX =
      this.panelWidth / 2 - this.panelPadding - 20;

    // --- LOGICA DE MAPEAMENTO INICIAL ---
    let percentage: number;
    let initialText: string;

    if (settingKey === "uiScale") {
      // Converte o valor logico (0.5 a 1.5) para a posição do slider (0 a 1)
      const currentVal = this.settings.uiScale as number;
      percentage = Phaser.Math.Clamp(
        (currentVal - 0.5) / (1.5 - 0.5),
        0,
        1,
      );
      initialText = Math.round(currentVal * 100) + "%";
    } else {
      // Volumes normais (0 a 1)
      percentage = this.settings[settingKey] as number;
      initialText = Math.round(percentage * 100) + "%";
    }

    this.addLabel(label, labelX, y);
    const trackStartX = sliderX - this.sliderWidth / 2;

    // Track
    const track = this.scene.add
      .rectangle(sliderX, y, this.sliderWidth, 6, 0x3a3a3a)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false });

    // Fill
    const fillWidth = this.sliderWidth * percentage;
    const fillX = trackStartX + fillWidth / 2;
    const fill = this.scene.add
      .rectangle(
        fillX,
        y,
        fillWidth,
        6,
        +`0x${COLORS.gold}`,
      )
      .setOrigin(0.5);

    // Knob
    const knobX =
      trackStartX + this.sliderWidth * percentage;
    const knob = this.scene.add
      .circle(knobX, y, 6, 0xffffff)
      .setInteractive({
        useHandCursor: false,
        draggable: true,
      })
      .on("pointerover", () => {
        this.cursorManager.setState("hover");
      })
      .on("pointerout", () => {
        this.cursorManager.setState("default");
      });

    const value = this.scene.add
      .text(valueX, y, initialText, {
        // Usa o initialText calculado
        fontFamily: "'VT323'",
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(1, 0.5);

    // Interatividade do slider
    const updateSlider = (
      pointer: Phaser.Input.Pointer,
    ) => {
      const localX = pointer.x - this.container.x;
      // IMPORTANTE: Ajuste de escala do container para o mouse não desviar
      const scaledRelativeX =
        localX / this.container.scaleX - trackStartX;

      const newPercentage = Phaser.Math.Clamp(
        scaledRelativeX / this.sliderWidth,
        0,
        1,
      );

      // Lógica de gravação diferenciada
      if (settingKey === "uiScale") {
        const finalScale = 0.5 + newPercentage * 1.0; // Mapeia para 0.5 - 1.5
        this.settings.uiScale = finalScale;
        value.setText(Math.round(finalScale * 100) + "%"); // Exibe 50% a 150%
      } else {
        (this.settings[settingKey] as number) =
          newPercentage;
        value.setText(
          Math.round(newPercentage * 100) + "%",
        );
      }

      const newKnobX =
        trackStartX + this.sliderWidth * newPercentage;
      const newFillWidth = this.sliderWidth * newPercentage;
      const newFillX = trackStartX + newFillWidth / 2;

      knob.setPosition(newKnobX, y);
      fill.setSize(newFillWidth, 6);
      fill.setPosition(newFillX, y);

      // 4. Texto de exibição (Sempre mostra 0-100% para o usuário não se confundir)
      // value.setText(Math.round(newPercentage * 100) + "%");
    };

    knob.on("drag", (pointer: Phaser.Input.Pointer) => {
      updateSlider(pointer);
    });

    track.on(
      "pointerdown",
      (pointer: Phaser.Input.Pointer) => {
        updateSlider(pointer);
      },
    );

    this.container.add([track, fill, knob, value]);
  }

  private addFontSizeRow(y: number): void {
    const labelX = -this.panelWidth / 2 + this.panelPadding;
    const sliderX = 40;
    const percentage = this.settings.fontSize;

    this.addLabel("Tamanho da Fonte:", labelX, y);

    const trackStartX = sliderX - this.sliderWidth / 2;

    const track = this.scene.add
      .rectangle(sliderX, y, this.sliderWidth, 6, 0x3a3a3a)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: false });

    const fillWidth = this.sliderWidth * percentage;
    const fillX = trackStartX + fillWidth / 2;
    const fill = this.scene.add
      .rectangle(
        fillX,
        y,
        fillWidth,
        6,
        +`0x${COLORS.gold}`,
      )
      .setOrigin(0.5);

    const knobX =
      trackStartX + this.sliderWidth * percentage;
    const knob = this.scene.add
      .circle(knobX, y, 6, 0xffffff)
      .setInteractive({
        useHandCursor: false,
        draggable: true,
      });

    const getFontSizeText = (p: number): string => {
      if (p < 0.33) return "Pequeno";
      if (p < 0.66) return "Normal";
      return "Grande";
    };

    const value = this.scene.add
      .text(
        this.panelWidth / 2 - this.panelPadding - 20,
        y,
        getFontSizeText(percentage),
        {
          fontFamily: "'VT323'",
          fontSize: "16px",
          color: "#ffffff",
        },
      )
      .setOrigin(1, 0.5);

    const updateSlider = (
      pointer: Phaser.Input.Pointer,
    ) => {
      const localX = pointer.x - this.container.x;
      const relativeX = localX - trackStartX;
      const newPercentage = Phaser.Math.Clamp(
        relativeX / this.sliderWidth,
        0,
        1,
      );

      this.settings.fontSize = newPercentage;

      const newKnobX =
        trackStartX + this.sliderWidth * newPercentage;
      const newFillWidth = this.sliderWidth * newPercentage;
      const newFillX = trackStartX + newFillWidth / 2;

      knob.setPosition(newKnobX, y);
      fill.setSize(newFillWidth, 6);
      fill.setPosition(newFillX, y);
      value.setText(getFontSizeText(newPercentage));
    };

    knob
      .on("drag", (pointer: Phaser.Input.Pointer) => {
        updateSlider(pointer);
      })
      .on("pointerover", () => {
        this.cursorManager.setState("hover");
      })
      .on("pointerout", () => {
        this.cursorManager.setState("default");
      });

    track.on(
      "pointerdown",
      (pointer: Phaser.Input.Pointer) => {
        updateSlider(pointer);
      },
    );

    this.container.add([track, fill, knob, value]);
  }

  private updateLocalSettingsFromManager(): void {
    if (!this.settingsPort) {
      console.error(
        "SettingsManager ainda não foi inicializado!",
      );
      return;
    }

    const globalSettings = this.settingsPort.getSettings();

    // Sincroniza os valores locais com os valores salvos no Manager
    this.settings.masterVolume =
      globalSettings.masterVolume;

    // IMPORTANTE: Como no applySettings você salva musicVolume * masterVolume,
    // ao ler de volta, precisamos dividir para que o slider mostre o valor relativo correto
    // ou simplesmente salvar os valores puros no Manager.
    // Se o Manager já salva de 0 a 1 separadamente, use:
    this.settings.musicVolume = globalSettings.musicVolume;
    this.settings.sfxVolume = globalSettings.sfxVolume;

    this.settings.uiScale = globalSettings.uiScale;
    this.settings.fontSize = globalSettings.fontSize;
    this.settings.language = globalSettings.language;
    this.settings.fullscreen = globalSettings.fullscreen;
  }

  private applySettings(): void {
    // Salve os valores sem multiplicar aqui.
    // Deixe o AudioManager ou o Manager lidar com a hierarquia.
    this.settingsPort.updateSettings({
      masterVolume: this.settings.masterVolume,
      musicVolume: this.settings.musicVolume, // Valor puro do slider
      sfxVolume: this.settings.sfxVolume, // Valor puro do slider
      fullscreen: this.settings.fullscreen,
      uiScale: this.settings.uiScale,
      fontSize: this.settings.fontSize,
      language: this.settings.language,
    });

    this.scene.game.events.emit(
      SettingsManager.EVENTS.VOLUME_CHANGED,
    );

    this.scene.time.delayedCall(500, () => {
      this.toggle();
    });
  }
}
