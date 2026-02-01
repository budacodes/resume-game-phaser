import Phaser from "phaser";
import { CursorPort, CursorState } from "../../application/ports/CursorPort";
import { CursorManager } from "../../managers/CursorManager";

export class CursorManagerAdapter implements CursorPort {
  constructor(private readonly cursor: CursorManager) {}

  setState(state: CursorState): void {
    this.cursor.setState(state);
  }

  setScene(scene: Phaser.Scene): void {
    this.cursor.setScene(scene);
  }

  showCursor(): void {
    this.cursor.showCursor();
  }
}
