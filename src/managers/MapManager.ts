// src/systems/MapManager.ts
import { Scene, Tilemaps } from "phaser";
import { LAYER_CONFIG } from "../config/Layers"; // Importe a config nova

export class MapManager {
  private scene: Scene;
  public map!: Tilemaps.Tilemap;
  public colliders: Tilemaps.TilemapLayer[] = [];
  public interactionLayer: Tilemaps.ObjectLayer | null =
    null;
  public spawnLayer: Tilemaps.ObjectLayer | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public init(mapKey: string) {
    this.map = this.scene.make.tilemap({ key: mapKey });

    // 1. Carregar Tilesets (Mantém igual, carrega todos)
    const t1 = this.map.addTilesetImage(
      "interiors",
      "tiles_interiors"
    );
    const t2 = this.map.addTilesetImage(
      "room",
      "tiles_builder"
    );
    const t3 = this.map.addTilesetImage(
      "urban",
      "tiles_urban"
    );
    const t4 =
      this.map.addTilesetImage("signs", "img_signs") ||
      this.map.addTilesetImage("sings", "img_signs");

    const tilesets = [t1, t2, t3, t4].filter(
      (t) => t !== null
    ) as Tilemaps.Tileset[];

    // =================================================================
    // 2. LOOP AUTOMÁTICO DE LAYERS (A Mágica acontece aqui)
    // =================================================================

    this.colliders = []; // Zera colisores

    // Percorre TODAS as layers que existem no JSON deste mapa
    this.map.layers.forEach((layerData) => {
      const layerName = layerData.name;

      // Busca a configuração no nosso arquivo Layers.ts
      const config = LAYER_CONFIG[layerName];

      if (config) {
        // Cria a layer
        const layer = this.map.createLayer(
          layerName,
          tilesets,
          0,
          0
        );

        if (layer) {
          // Aplica o Depth definido na config
          layer.setDepth(config.depth);

          // Se a config diz que colide, adiciona na lista e ativa colisão
          if (config.collides) {
            layer.setCollisionByExclusion([-1]);
            this.colliders.push(layer);
          }
        }
      } else {
        // Aviso útil no console se você criou uma layer no Tiled e esqueceu de por na config
        console.warn(
          `⚠️ A layer '${layerName}' existe no Tiled mas não está no src/config/Layers.ts. Ela será ignorada ou ficará invisível.`
        );
      }
    });

    // =================================================================
    // 3. CONFIGURAÇÕES FINAIS (Limites, Objetos)
    // =================================================================
    this.scene.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.scene.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.scene.cameras.main.setZoom(2);

    this.interactionLayer =
      this.map.getObjectLayer("Interactions");
    this.spawnLayer = this.map.getObjectLayer("Spawns");
  }

  public getSpawnPoint(
    name: string
  ): { x: number; y: number } | null {
    if (!this.spawnLayer) return null;
    const obj = this.spawnLayer.objects.find(
      (o) => o.name === name
    );
    if (!obj) return null;
    return { x: obj.x || 0, y: obj.y || 0 };
  }
}
