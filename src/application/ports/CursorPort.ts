import Phaser from "phaser";

export type CursorState = "default" | "hover";

export interface CursorPort {
  setState(state: CursorState): void;
  setScene(scene: Phaser.Scene): void;
  showCursor(): void;
}
