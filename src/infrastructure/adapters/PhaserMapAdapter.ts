import Phaser from "phaser";
import { MapPort } from "../../application/ports/MapPort";
import { MapManager } from "../../managers/MapManager";

export class PhaserMapAdapter implements MapPort {
  constructor(
    private readonly mapManager: MapManager,
  ) {}

  init(mapKey: string): void {
    this.mapManager.init(mapKey);
  }

  getSpawnPoint(
    spawnName: string,
  ): { x: number; y: number } | null {
    return this.mapManager.getSpawnPoint(spawnName);
  }

  getMapSize():
    | { widthInPixels: number; heightInPixels: number }
    | null {
    if (!this.mapManager.map) return null;
    return {
      widthInPixels: this.mapManager.map.widthInPixels,
      heightInPixels: this.mapManager.map.heightInPixels,
    };
  }

  getObjectLayerObjects(
    layerName: string,
  ): Phaser.Types.Tilemaps.TiledObject[] | null {
    const layer = this.mapManager.map?.getObjectLayer(
      layerName,
    );
    return layer?.objects ?? null;
  }

  getColliders(): Phaser.Tilemaps.TilemapLayer[] {
    return this.mapManager.colliders;
  }

  getInteractionObjects():
    | Phaser.Types.Tilemaps.TiledObject[]
    | null {
    return this.mapManager.interactionLayer?.objects ?? null;
  }
}
