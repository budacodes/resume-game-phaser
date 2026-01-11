// systems/CursorManager.ts
import { Scene } from "phaser";

// Tipos
export type CursorState =
  | "default"
  | "hover"
  | "click"
  | "loading"
  | "disabled"
  | "pointer"
  | "text";

export class CursorManager {
  // Singleton instance
  private static instance: CursorManager;

  // Propriedades da instância
  private currentScene: Phaser.Scene | null = null;
  private cursorSprite: Phaser.GameObjects.Sprite | null =
    null;
  private currentState: CursorState = "default";
  private isCustomCursorEnabled: boolean = true;
  private isInitialized: boolean = false;
  private isInitializedWithScene: boolean = false;
  private cssStyleElement: HTMLStyleElement | null = null;

  // Mapeamento frame -> estado
  private frameMap: Record<CursorState, number> = {
    default: 2, // Ponteiro normal
    hover: 0, // Sobre elemento interativo
    click: 1, // Clicando
    loading: 2, // Carregando/espera
    disabled: 2, // Não disponível
    pointer: 0, // Mãozinha (equivalente a hover)
    text: 2, // Texto (mantém default)
  };

  // Mapeamento para cursores CSS (fallback)
  private cssCursorMap: Record<CursorState, string> = {
    default: "default",
    hover: "pointer",
    click: "pointer",
    loading: "wait",
    disabled: "not-allowed",
    pointer: "pointer",
    text: "text",
  };

  // Construtor privado para Singleton
  private constructor() {}

  // Método para obter a instância única
  public static getInstance(): CursorManager {
    if (!CursorManager.instance) {
      CursorManager.instance = new CursorManager();
    }
    return CursorManager.instance;
  }

  // Inicializa com uma cena (chamado apenas pela UIScene)
  public initialize(scene: Phaser.Scene): void {
    // Se já foi inicializado com qualquer cena, NÃO inicialize novamente
    if (this.isInitializedWithScene) {
      console.log(
        "CursorManager já inicializado. Apenas atualizando cena."
      );
      this.updateScene(scene);
      return;
    }

    console.log(
      "CursorManager: Inicializando pela primeira vez"
    );
    this.currentScene = scene;
    this.isInitializedWithScene = true;
    this.isInitialized = true;

    // Configura o cursor baseado no que está disponível
    if (scene.textures.exists("custom-cursor")) {
      this.setupCustomCursor();
    } else {
      console.warn(
        "Texture 'custom-cursor' não encontrada. Usando cursores CSS."
      );
      this.isCustomCursorEnabled = false;
      this.setupCssCursor();
    }
  }

  // Atualiza para uma nova cena (chamado por outras cenas)
  public updateScene(scene: Phaser.Scene): void {
    if (this.currentScene === scene) return;

    console.log(
      "CursorManager: Atualizando para cena:",
      scene.scene.key
    );

    // Remove listeners da cena antiga
    this.cleanupScene();

    // Atualiza para nova cena
    this.currentScene = scene;

    // IMPORTANTE: Não recria o cursor sprite, apenas atualiza referências
    if (
      this.cursorSprite &&
      this.cursorSprite.scene !== scene
    ) {
      // Move o sprite para a nova cena se necessário
      scene.add.existing(this.cursorSprite);
    }

    // Reconecta o listener de pointermove
    this.reconnectPointerMoveListener();

    // Aplica o estado atual
    this.setState(this.currentState);
  }

  // Reconecta o listener de movimento do mouse
  private reconnectPointerMoveListener(): void {
    if (!this.currentScene || !this.cursorSprite) return;

    // Remove listener antigo se existir
    this.currentScene.input.off("pointermove");

    // Reconecta o listener para atualizar posição do cursor
    this.currentScene.input.on(
      "pointermove",
      (pointer: Phaser.Input.Pointer) => {
        if (
          this.cursorSprite &&
          this.cursorSprite.visible
        ) {
          this.cursorSprite.setPosition(
            pointer.x,
            pointer.y
          );
        }
      }
    );
  }

  // Configura cursor customizado com sprite
  private setupCustomCursor(): void {
    if (!this.currentScene) return;

    // Cria sprite do cursor
    this.cursorSprite = this.currentScene.add
      .sprite(
        this.currentScene.input.activePointer.x,
        this.currentScene.input.activePointer.y,
        "custom-cursor"
      )
      .setVisible(false)
      .setDepth(99999)
      .setScrollFactor(0)
      .setScale(0.75)
      .setOrigin(0.1, 0.1);

    // Atualiza posição do cursor customizado
    this.currentScene.input.on(
      "pointermove",
      (pointer: Phaser.Input.Pointer) => {
        if (
          this.cursorSprite &&
          this.cursorSprite.visible
        ) {
          this.cursorSprite.setPosition(
            pointer.x,
            pointer.y
          );
        }
      }
    );

    // Esconde cursor padrão do sistema
    this.currentScene.input.setDefaultCursor("none");

    // Mostra o cursor customizado
    this.showCursor();
  }

  // Configura cursores CSS (fallback)
  private setupCssCursor(): void {
    if (!this.currentScene) return;

    // Inicia com cursor padrão
    this.currentScene.input.setDefaultCursor(
      this.cssCursorMap[this.currentState]
    );
  }

  // Método para mudar estado do cursor
  public setState(state: CursorState): void {
    if (this.currentState === state) return;

    this.currentState = state;

    if (this.isCustomCursorEnabled && this.cursorSprite) {
      // Usa cursor sprite personalizado
      const frameIndex = this.frameMap[state];
      if (frameIndex !== undefined) {
        this.cursorSprite.setFrame(frameIndex);

        // Mostra o sprite se estava oculto
        if (!this.cursorSprite.visible) {
          this.cursorSprite.setVisible(true);
        }
      }

      // Garante que o cursor do sistema está escondido
      if (this.currentScene) {
        this.currentScene.input.setDefaultCursor("none");
      }
    } else {
      // Usa cursores CSS como fallback
      const cssCursor =
        this.cssCursorMap[state] || "default";
      if (this.currentScene) {
        this.currentScene.input.setDefaultCursor(cssCursor);
      }
    }
  }

  // Para interações específicas (conveniência)
  public setInteractiveState(
    object: Phaser.GameObjects.GameObject
  ): void {
    object
      .on("pointerover", () => this.setState("hover"))
      .on("pointerout", () => this.setState("default"))
      .on("pointerdown", () => this.setState("click"))
      .on("pointerup", () => this.setState("hover"));
  }

  // Mostra o cursor
  public showCursor(): void {
    if (this.cursorSprite) {
      this.cursorSprite.setVisible(true);
    }

    // Se for cursor customizado, esconde o do sistema
    if (this.isCustomCursorEnabled && this.currentScene) {
      this.currentScene.input.setDefaultCursor("none");
    } else if (this.currentScene) {
      this.currentScene.input.setDefaultCursor(
        this.cssCursorMap[this.currentState]
      );
    }
  }

  // Esconde o cursor
  public hideCursor(): void {
    if (this.cursorSprite) {
      this.cursorSprite.setVisible(false);
    }

    // Mostra cursor padrão quando esconder o customizado
    if (this.currentScene) {
      this.currentScene.input.setDefaultCursor("default");
    }
  }

  // Habilita/desabilita cursor customizado
  public setCustomCursorEnabled(enabled: boolean): void {
    this.isCustomCursorEnabled = enabled;

    if (enabled && this.currentScene && this.cursorSprite) {
      this.currentScene.input.setDefaultCursor("none");
      this.cursorSprite.setVisible(true);
    } else if (!enabled && this.currentScene) {
      this.currentScene.input.setDefaultCursor(
        this.cssCursorMap[this.currentState]
      );
      if (this.cursorSprite) {
        this.cursorSprite.setVisible(false);
      }
    }
  }

  // Fix para conflitos de cursor
  public fixCursorConflict(): void {
    if (!this.currentScene) return;

    // APENAS se o cursor customizado está ativo
    if (this.isCustomCursorActive()) {
      // Força esconder cursor do sistema no Phaser
      this.currentScene.input.setDefaultCursor("none");

      // Também no HTML
      document.body.style.cursor = "none";

      // Remove estilo anterior se existir
      this.removeCursorFixStyle();

      // Adiciona novo estilo
      this.addCursorFixStyle();

      // Garante que nosso cursor customizado está visível
      if (this.cursorSprite) {
        this.cursorSprite.setVisible(true);
      }
    }
  }

  // Adiciona estilo CSS para fixar cursor
  private addCursorFixStyle(): void {
    this.cssStyleElement = document.createElement("style");
    this.cssStyleElement.id = "cursor-manager-fix";
    this.cssStyleElement.innerHTML = `
      * {
        cursor: none !important;
      }
      
      canvas {
        cursor: none !important;
      }
    `;

    document.head.appendChild(this.cssStyleElement);
  }

  // Remove estilo CSS de fixação
  private removeCursorFixStyle(): void {
    if (this.cssStyleElement) {
      this.cssStyleElement.remove();
      this.cssStyleElement = null;
    }

    // Remove também por ID para garantir
    const oldStyle = document.getElementById(
      "cursor-manager-fix"
    );
    if (oldStyle) {
      oldStyle.remove();
    }
  }

  // Limpa listeners da cena atual
  private cleanupScene(): void {
    if (this.currentScene && this.cursorSprite) {
      this.currentScene.input.off("pointermove");
    }
  }

  // Destrói o cursor
  public destroy(): void {
    this.cleanupScene();
    this.removeCursorFixStyle();

    if (this.cursorSprite) {
      this.cursorSprite.destroy();
      this.cursorSprite = null;
    }

    if (this.currentScene) {
      this.currentScene.input.setDefaultCursor("default");
    }

    this.currentScene = null;
    this.isInitialized = false;
    this.isInitializedWithScene = false;
    this.currentState = "default";
  }

  // Getters
  public getState(): CursorState {
    return this.currentState;
  }

  public isCustomCursorActive(): boolean {
    return (
      this.isCustomCursorEnabled &&
      this.cursorSprite !== null
    );
  }

  public getCurrentScene(): Phaser.Scene | null {
    return this.currentScene;
  }
}
