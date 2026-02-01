import Phaser from "phaser";

export interface MapPort {
  init(mapKey: string): void;
  getSpawnPoint(
    spawnName: string,
  ): { x: number; y: number } | null;
  getMapSize():
    | { widthInPixels: number; heightInPixels: number }
    | null;
  getObjectLayerObjects(
    layerName: string,
  ): Phaser.Types.Tilemaps.TiledObject[] | null;
  getColliders(): Phaser.Tilemaps.TilemapLayer[];
  getInteractionObjects():
    | Phaser.Types.Tilemaps.TiledObject[]
    | null;
}
