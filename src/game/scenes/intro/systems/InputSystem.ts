// systems/InputSystem.ts
import { Scene } from "phaser";

export class InputSystem {
  private scene: Scene;
  private continueCallback: (() => void) | null = null;
  private keyboardListeners: Map<string, Function> =
    new Map();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  setup(): void {
    // Configuração básica do sistema de input
  }

  onContinue(callback: () => void): void {
    this.removeAllListeners();
    this.continueCallback = callback;

    const enterListener = (event: KeyboardEvent) => {
      event.preventDefault();
      if (this.continueCallback) {
        this.continueCallback();
      }
    };

    const spaceListener = (event: KeyboardEvent) => {
      event.preventDefault();
      if (this.continueCallback) {
        this.continueCallback();
      }
    };

    // Adiciona listeners com prevenção de propagação
    this.scene.input.keyboard?.on(
      "keydown-ENTER",
      enterListener
    );
    this.scene.input.keyboard?.on(
      "keydown-SPACE",
      spaceListener
    );

    this.keyboardListeners.set("ENTER", enterListener);
    this.keyboardListeners.set("SPACE", spaceListener);
  }

  removeAllListeners(): void {
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      // Remove todos os listeners específicos
      this.keyboardListeners.forEach((listener, key) => {
        keyboard.off(`keydown-${key}`, listener);
      });
      this.keyboardListeners.clear();
      // Remove também listeners gerais
      keyboard.removeAllListeners();
    }
    this.continueCallback = null;
  }

  destroy(): void {
    this.removeAllListeners();
  }
}
