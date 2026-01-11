// components/NameInput.ts
import { Scene } from "phaser";

export class NameInput {
  private scene: Scene;
  private onComplete: (name: string) => void;
  private inputContainer!: Phaser.GameObjects.Container;
  private inputField!: Phaser.GameObjects.DOMElement;
  private instructionText!: Phaser.GameObjects.Text;
  private interactiveArea!: Phaser.GameObjects.Zone;
  private keyboardListeners: Map<string, Function> =
    new Map();
  private inputElement!: HTMLInputElement;
  private caret!: Phaser.GameObjects.Rectangle;
  private caretBlinkTimer!: Phaser.Time.TimerEvent;
  private caretVisible: boolean = true;
  private inputText!: Phaser.GameObjects.Text;
  private placeholderText!: Phaser.GameObjects.Text;
  private inputBackground!: Phaser.GameObjects.Graphics;

  constructor(
    scene: Scene,
    onComplete: (name: string) => void
  ) {
    this.scene = scene;
    this.onComplete = onComplete;
  }

  public create(): void {
    // Remove todos os listeners anteriores do teclado
    this.removeKeyboardListeners();

    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    // Cria container principal
    this.inputContainer = this.scene.add.container(0, 0);

    // Cria área interativa separada (Zone)
    this.interactiveArea = this.scene.add
      .zone(centerX, centerY - 50, 400, 60)
      .setInteractive({
        dropZone: false,
        pixelPerfect: false,
        alphaTolerance: 1,
      });

    this.inputContainer.add(this.interactiveArea);

    // Cria o input customizado
    this.createCustomInput(centerX, centerY);

    // Texto de instrução
    this.instructionText = this.scene.add
      .text(
        centerX,
        centerY + 80,
        "[ ENTER para confirmar ]",
        {
          fontSize: "24px",
          fontFamily: "'VT323', monospace",
          color: "#ffffff",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: { x: 20, y: 10 },
        }
      )
      .setOrigin(0.5);

    this.inputContainer.add(this.instructionText);

    // Configura listeners do teclado
    this.setupKeyboardListeners();

    // Impede que o mouse mude para cursor padrão
    this.scene.input.setDefaultCursor("default");

    // Inicia a animação do caret
    this.startCaretBlink();
  }

  private createCustomInput(
    centerX: number,
    centerY: number
  ): void {
    // Cria um container para o input customizado
    const customInputContainer = this.scene.add.container(
      centerX,
      centerY - 50
    );

    // Fundo do input
    this.inputBackground = this.scene.add.graphics();
    this.inputBackground.fillStyle(0x000000, 0.9);
    this.inputBackground.fillRoundedRect(
      -200,
      -30,
      400,
      60,
      10
    );
    this.inputBackground.lineStyle(3, 0xffffff, 1);
    this.inputBackground.strokeRoundedRect(
      -200,
      -30,
      400,
      60,
      10
    );

    // Texto do placeholder (inicial)
    this.placeholderText = this.scene.add
      .text(-180, 0, "DIGITE SEU NOME", {
        fontSize: "32px",
        fontFamily: "'VT323', monospace",
        color: "#444444",
      })
      .setOrigin(0, 0.5);

    // Texto do input (onde o nome digitado aparece)
    this.inputText = this.scene.add
      .text(-180, 0, "", {
        fontSize: "32px",
        fontFamily: "'VT323', monospace",
        color: "#ffffff",
      })
      .setOrigin(0, 0.5);

    // Caret (cursor) - mais grosso e no canto esquerdo
    this.caret = this.scene.add.rectangle(
      -180,
      0,
      4,
      40,
      0xffffff
    );
    this.caret.setOrigin(0, 0.5);

    // Adiciona todos os elementos ao container do input
    customInputContainer.add([
      this.inputBackground,
      this.placeholderText,
      this.inputText,
      this.caret,
    ]);

    // Adiciona o container do input ao container principal
    this.inputContainer.add(customInputContainer);

    // Cria o elemento DOM invisível para capturar entrada do teclado
    this.createHiddenInputElement();
  }

  private createHiddenInputElement(): void {
    // Cria um input DOM invisível para capturar entrada
    this.inputElement = document.createElement("input");
    this.inputElement.type = "text";
    this.inputElement.maxLength = 20;
    this.inputElement.autocomplete = "off";
    this.inputElement.autocapitalize = "off";
    this.inputElement.spellcheck = false;

    // Estilo para ficar invisível mas ainda capturar foco
    this.inputElement.style.cssText = `
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
      border: none;
      background: transparent;
      color: transparent;
      caret-color: transparent;
      outline: none;
    `;

    // Posiciona o input DOM na tela (fora da área visível)
    this.inputField = this.scene.add.dom(
      -1000,
      -1000,
      this.inputElement
    );

    // Evento para atualizar o texto visual
    this.inputElement.addEventListener("input", () => {
      this.updateInputDisplay();
    });

    // Evento para teclas especiais
    this.inputElement.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Backspace" ||
          event.key === "Delete"
        ) {
          // Atualiza após um pequeno delay para garantir que o valor foi atualizado
          this.scene.time.delayedCall(10, () => {
            this.updateInputDisplay();
          });
        }
      }
    );

    // Foca no input automaticamente
    this.scene.time.delayedCall(100, () => {
      this.inputElement.focus();
      this.inputElement.select();

      // Garante que o caret está visível quando focado
      this.caretVisible = true;
      this.caret.setAlpha(1);
      this.restartCaretBlink();
    });

    // Quando a área interativa for clicada, foca no input
    this.interactiveArea.on("pointerdown", () => {
      this.inputElement.focus();
      this.inputElement.select();
      this.caretVisible = true;
      this.caret.setAlpha(1);
      this.restartCaretBlink();
    });
  }

  private updateInputDisplay(): void {
    const value = this.inputElement.value.toUpperCase();
    this.inputText.setText(value);

    // Atualiza posição do caret
    const textWidth = this.inputText.width;
    this.caret.setX(-180 + textWidth);

    // Esconde placeholder se houver texto
    this.placeholderText.setVisible(value.length === 0);

    // Ajusta a altura do caret
    this.caret.setSize(4, value.length > 0 ? 40 : 50);

    // Reinicia o blink do caret quando há digitação
    this.restartCaretBlink();
  }

  private startCaretBlink(): void {
    // Remove timer anterior se existir
    if (this.caretBlinkTimer) {
      this.caretBlinkTimer.remove();
    }

    // Cria novo timer para piscar o caret
    this.caretBlinkTimer = this.scene.time.addEvent({
      delay: 500, // Pisca a cada 500ms
      callback: () => {
        this.caretVisible = !this.caretVisible;
        this.caret.setAlpha(this.caretVisible ? 1 : 0);
      },
      loop: true,
    });
  }

  private restartCaretBlink(): void {
    // Torna o caret visível
    this.caretVisible = true;
    this.caret.setAlpha(1);

    // Reinicia o timer de blink
    if (this.caretBlinkTimer) {
      this.caretBlinkTimer.remove();
    }

    this.caretBlinkTimer = this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        this.caretVisible = !this.caretVisible;
        this.caret.setAlpha(this.caretVisible ? 1 : 0);
      },
      loop: true,
    });
  }

  private setupKeyboardListeners(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    // Remove qualquer listener anterior
    keyboard.removeAllListeners();

    // Função para submeter o nome
    const submitName = () => {
      const name = this.inputElement.value.trim();
      if (name.length > 0) {
        // Para a animação do caret
        if (this.caretBlinkTimer) {
          this.caretBlinkTimer.remove();
        }

        // Remove listeners primeiro para evitar múltiplas chamadas
        this.removeKeyboardListeners();

        this.onComplete(name);
      } else {
        // Efeito de erro se o nome estiver vazio
        this.scene.tweens.add({
          targets: this.inputContainer,
          x: {
            from: this.inputContainer.x - 5,
            to: this.inputContainer.x + 5,
          },
          duration: 50,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            this.inputContainer.x = 0;
          },
        });
      }
    };

    // Listener para ENTER
    const enterListener = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        submitName();
      }
    };

    // Listener para ESC (para cancelar)
    const escListener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        // Se pressionar ESC, define um nome padrão
        this.inputElement.value = "JOGADOR";
        this.updateInputDisplay();
        this.scene.time.delayedCall(100, () => {
          submitName();
        });
      }
    };

    // Listener para qualquer tecla (para reiniciar o blink do caret)
    const anyKeyListener = (event: KeyboardEvent) => {
      // Não processa teclas de controle
      if (
        event.key.length === 1 ||
        event.key === "Backspace" ||
        event.key === "Delete"
      ) {
        this.restartCaretBlink();
      }
    };

    // Adiciona listeners
    keyboard.on("keydown", enterListener);
    keyboard.on("keydown", escListener);
    keyboard.on("keydown", anyKeyListener);

    // Também adiciona listener direto no elemento DOM
    this.inputElement.addEventListener(
      "keydown",
      enterListener
    );
    this.inputElement.addEventListener(
      "keydown",
      escListener
    );
    this.inputElement.addEventListener(
      "keydown",
      anyKeyListener
    );

    // Armazena os listeners para remoção posterior
    this.keyboardListeners.set("enter", enterListener);
    this.keyboardListeners.set("esc", escListener);
    this.keyboardListeners.set("any", anyKeyListener);
  }

  private removeKeyboardListeners(): void {
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      this.keyboardListeners.forEach((listener) => {
        keyboard.off("keydown", listener);
      });
      this.keyboardListeners.clear();
      keyboard.removeAllListeners();
    }

    // Remove listeners do elemento DOM
    if (this.inputElement) {
      this.keyboardListeners.forEach((listener, key) => {
        this.inputElement.removeEventListener(
          "keydown",
          listener as any
        );
      });
    }

    // Para a animação do caret
    if (this.caretBlinkTimer) {
      this.caretBlinkTimer.remove();
    }
  }

  public destroy(): void {
    this.removeKeyboardListeners();

    // Restaura o cursor padrão do sistema
    this.scene.input.setDefaultCursor("");

    if (this.inputContainer) {
      this.inputContainer.destroy();
    }
    if (this.inputField) {
      this.inputField.destroy();
    }
  }
}
