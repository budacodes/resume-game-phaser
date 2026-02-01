import Phaser from "phaser";
import { FlagRepository } from "../../application/ports/FlagRepository";

export class PhaserRegistryFlagRepository implements FlagRepository {
  constructor(private readonly scene: Phaser.Scene) {}

  hasSeen(flagId: string): boolean {
    return Boolean(this.scene.registry.get(flagId));
  }

  markSeen(flagId: string): void {
    this.scene.registry.set(flagId, true);
  }
}
