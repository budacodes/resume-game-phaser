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

  private hideDelay = 3000; // ms
  private lastMoveTime = 0;
  private isOverUI = false;
  private isAutoHidden = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  constructor() {}

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
        this.frameMap.default,
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

    this.scene.game.events.on("ui:hover-start", () => {
      this.isOverUI = true;
      this.showCursor();
      this.isAutoHidden = false;
    });

    this.scene.game.events.on("ui:hover-end", () => {
      this.isOverUI = false;
      this.lastMoveTime = performance.now();
    });

    this.initialized = true;

    this.lastMoveTime = performance.now();
    this.showCursor();
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
    const now = performance.now();

    const moved =
      pointer.x !== this.lastPointerX ||
      pointer.y !== this.lastPointerY;

    this.lastPointerX = pointer.x;
    this.lastPointerY = pointer.y;

    if (moved) {
      this.lastMoveTime = now;

      if (this.isAutoHidden) {
        this.showCursor();
        this.isAutoHidden = false;
      }
    }

    if (
      pointer.position.x !== 0 ||
      pointer.position.y !== 0
    ) {
      this.cursorSprite.setPosition(pointer.x, pointer.y);
    }

    if (
      !this.isOverUI &&
      !this.isAutoHidden &&
      this.lastMoveTime !== 0 &&
      now - this.lastMoveTime > this.hideDelay
    ) {
      this.hideCursor();
      this.isAutoHidden = true;
    }

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
    if (!this.cursorSprite) return;

    this.cursorSprite.setVisible(true);
    this.isAutoHidden = false;
  }

  public hideCursor() {
    this.cursorSprite?.setVisible(false);
  }

  public lockCursorVisible() {
    this.isOverUI = true;
    this.showCursor();
  }

  public unlockCursorVisible() {
    this.isOverUI = false;
    this.lastMoveTime = performance.now();
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
