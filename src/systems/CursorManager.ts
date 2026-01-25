import { Scene } from "phaser";

export type CursorState =
  | "default"
  | "hover"
  | "click"
  | "loading"
  | "disabled"
  | "pointer"
  | "text";

export class CursorManager {
  private static instance: CursorManager;
  private hasFocus = true;

  private scene!: Scene;
  private cursorSprite!: Phaser.GameObjects.Sprite;

  private currentState: CursorState = "default";
  private isCustomCursorEnabled = true;
  private initialized = false;

  private frameMap: Record<CursorState, number> = {
    default: 2,
    hover: 0,
    click: 1,
    loading: 2,
    disabled: 2,
    pointer: 0,
    text: 2,
  };

  private constructor() {}

  public static getInstance(): CursorManager {
    if (!CursorManager.instance) {
      CursorManager.instance = new CursorManager();
    }
    return CursorManager.instance;
  }

  // ─────────────────────────────────────────────
  // INIT (UMA ÚNICA VEZ – UIScene)
  // ─────────────────────────────────────────────
  public initialize(scene: Scene) {
    if (this.initialized) return;

    this.scene = scene;

    this.cursorSprite = scene.add
      .sprite(
        this.scene.scale.width / 2,
        this.scene.scale.height / 2,
        "custom-cursor",
        this.frameMap.default
      )
      .setOrigin(0)
      .setDepth(999999)
      .setScrollFactor(0)
      .setVisible(false);

    this.disableSystemCursorHard();

    const canvas = scene.game.canvas;

    canvas.addEventListener("mouseleave", () => {
      this.hasFocus = false;
      this.hideCursor();
    });

    canvas.addEventListener("mouseenter", () => {
      this.hasFocus = true;
    });

    window.addEventListener("blur", () => {
      this.hasFocus = false;
      this.hideCursor();
    });

    window.addEventListener("focus", () => {
      this.hasFocus = true;
    });

    this.initialized = true;
  }

  // Atualiza referência da cena ativa
  public setScene(scene: Scene) {
    this.scene = scene;
    this.disableSystemCursorHard();
  }

  // ─────────────────────────────────────────────
  // UPDATE (CHAMAR TODO FRAME)
  // ─────────────────────────────────────────────
  public update() {
    if (!this.scene || !this.cursorSprite) return;

    if (!this.hasFocus) return;

    const pointer = this.scene.input.activePointer;

    if (
      pointer.position.x !== 0 ||
      pointer.position.y !== 0
    ) {
      this.cursorSprite.setVisible(true);
      this.cursorSprite.setPosition(pointer.x, pointer.y);
    }

    // 🔥 TRAVA DEFINITIVA DO CURSOR DO SISTEMA
    this.disableSystemCursorHard();
  }

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  public setState(state: CursorState) {
    this.currentState = state;

    if (!this.isCustomCursorEnabled) return;

    this.cursorSprite.setFrame(this.frameMap[state]);
  }

  // ─────────────────────────────────────────────
  // HARD LOCK DO CURSOR DO SISTEMA
  // ─────────────────────────────────────────────
  private disableSystemCursorHard() {
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";

    if (this.scene?.game?.canvas) {
      this.scene.game.canvas.style.cursor = "none";
    }

    this.scene?.input?.setDefaultCursor("none");
  }

  // ─────────────────────────────────────────────
  // VISIBILITY
  // ─────────────────────────────────────────────
  public showCursor() {
    this.cursorSprite?.setVisible(true);
  }

  public hideCursor() {
    this.cursorSprite?.setVisible(false);
  }

  // ─────────────────────────────────────────────
  // FLAGS
  // ─────────────────────────────────────────────
  public setCustomCursorEnabled(enabled: boolean) {
    this.isCustomCursorEnabled = enabled;
  }

  public isCustomCursorActive(): boolean {
    return this.isCustomCursorEnabled;
  }
}
