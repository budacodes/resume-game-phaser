import { Scene } from "phaser";
import { Player } from "../../entities/Player";
import { MapPort } from "../../application/ports/MapPort";
import { UIScene } from "./ui/UiScene";
import { COLORS } from "./ui/Utils";
import { PhaserInteractionInput } from "../../infrastructure/adapters/PhaserInteractionInput";
import { PhaserDialogEventAdapter } from "../../infrastructure/adapters/PhaserDialogEventAdapter";
import { PhaserTimeScheduler } from "../../infrastructure/adapters/PhaserTimeScheduler";
import { ShowDialogUseCase } from "../../application/usecases/ShowDialogUseCase";
import { InteriorSceneComposition } from "../../composition/InteriorSceneComposition";
import { WarpUseCase } from "../../application/usecases/WarpUseCase";

export class InteriorScene extends Scene {
  // --- SISTEMAS ---
  private player!: Player;
  private mapPort!: MapPort;
  private uiScene!: UIScene;
  private doorOpenSound!: Phaser.Sound.BaseSound;
  private errorSound!: Phaser.Sound.BaseSound;

  // --- DADOS DE INICIALIZAÇÃO ---
  private mapKey!: string;
  private spawnName!: string;
  private initialFacing!: "up" | "down" | "right" | "left";

  // --- CONTROLES ---
  private interactionInput!: PhaserInteractionInput;
  private isInteractionCooldown: boolean = false;

  // --- INTERAÇÃO ---
  private itemsZone!: Phaser.Physics.Arcade.StaticGroup;
  private currentInteractiveObject: Phaser.GameObjects.Zone | null =
    null;
  private interactionPrompt!: Phaser.GameObjects.Sprite;

  // --- ESTADOS ---
  private isReading: boolean = false;

  private npcs!: Phaser.Physics.Arcade.Group;
  private hasAppointment: boolean = false;
  private dialogEventAdapter!: PhaserDialogEventAdapter;
  private timeScheduler!: PhaserTimeScheduler;
  private showDialogUseCase!: ShowDialogUseCase;
  private warpUseCase!: WarpUseCase;

  constructor() {
    super("InteriorScene");
  }

  /**
   * Recebe dados da cena anterior (MainScene)
   */
  init(data: {
    mapKey: string;
    spawnName: string;
    facingDirection?: "up" | "down" | "right" | "left";
  }) {
    this.mapKey = data.mapKey || "office";
    this.spawnName = data.spawnName || "spawn_entrance";
    this.initialFacing = data.facingDirection || "up";
  }

  create() {
    // 1. FUNDO PRETO
    this.cameras.main.setBackgroundColor("#111111");

    this.game.events.emit("scene-changed", "InteriorScene");
    this.game.events.emit("enable-joystick");

    // 2. RECUPERA A UI
    if (this.scene.isActive("UIScene")) {
      this.uiScene = this.scene.get("UIScene") as UIScene;
      this.scene.bringToTop("UIScene");
    } else {
      this.scene.launch("UIScene");
      this.uiScene = this.scene.get("UIScene") as UIScene;
      this.scene.bringToTop("UIScene");
    }

    // Garante que o estado de leitura/travamento comece limpo
    this.isReading = false;

    const composition = new InteriorSceneComposition(
      this,
    ).build({
      onStarted: () => {
        this.isReading = true;
      },
      onFinished: () => {
        this.isReading = false;
        this.startInteractionCooldown();
      },
    });
    this.dialogEventAdapter = composition.dialogEventAdapter;
    this.interactionInput = composition.interactionInput;
    this.timeScheduler = composition.timeScheduler;
    this.showDialogUseCase = composition.showDialogUseCase;
    this.warpUseCase = composition.warpUseCase;

    // 3. INICIALIZA MAPA
    this.mapPort = composition.mapPort;
    this.mapPort.init(this.mapKey);

    // 4. INICIALIZA PLAYER
    const spawn = this.mapPort.getSpawnPoint(
      this.spawnName,
    ) || { x: 100, y: 100 };

    this.player = new Player(this, spawn.x, spawn.y);
    this.player.setUIScene(this.uiScene);
    this.player.setFacing(this.initialFacing);

    this.createNPCs();

    if (this.npcs) {
      this.physics.add.collider(this.player, this.npcs);
    }

    // Colisões
    if (this.mapPort.getColliders().length > 0) {
      this.physics.add.collider(
        this.player,
        this.mapPort.getColliders(),
      );
    }

    // 5. CÂMERA
    const mapSize = this.mapPort.getMapSize();
    const mapWidth = mapSize?.widthInPixels ?? this.scale.width;
    const mapHeight =
      mapSize?.heightInPixels ?? this.scale.height;

    const zoom = 2;
    this.cameras.main.setZoom(zoom);

    const mapDisplayWidth = mapWidth * zoom;
    const mapDisplayHeight = mapHeight * zoom;
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    if (
      mapDisplayWidth < screenWidth &&
      mapDisplayHeight < screenHeight
    ) {
      this.cameras.main.removeBounds();
      this.cameras.main.centerOn(
        mapWidth / 2,
        mapHeight / 2,
      );
    } else {
      this.cameras.main.setBounds(
        0,
        0,
        mapWidth,
        mapHeight,
      );
      this.cameras.main.startFollow(
        this.player,
        true,
        0.09,
        0.09,
      );
    }

    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.initAudioAndInputs();
    this.createInteractionZones();
    this.dialogEventAdapter.subscribe();
  }

  private startInteractionCooldown(): void {
    this.isInteractionCooldown = true;
    this.timeScheduler.delay(500, () => {
      this.isInteractionCooldown = false;
    });
  }

  private initAudioAndInputs() {
    this.doorOpenSound = this.sound.add("snd_door_open", {
      volume: 1,
      seek: 3,
    });

    this.errorSound = this.sound.add("snd_error", {
      volume: 1,
      seek: 0,
    });

    this.interactionPrompt = this.add
      .sprite(0, -16, "btn-e")
      .setDepth(100)
      .setVisible(false);
  }

  private createNPCs() {
    this.npcs = this.physics.add.group({
      immovable: true,
      allowGravity: false,
    });

    const npcObjects =
      this.mapPort.getObjectLayerObjects("NPCs");

    if (!npcObjects) {
      console.warn(
        "Camada 'NPCs' não encontrada no Tiled.",
      );
      return;
    }

    const adaObj = npcObjects.find(
      (obj) => obj.name === "NPC_Ada",
    );

    if (adaObj) {
      const x = adaObj.x || 0;
      const y = adaObj.y || 0;

      const ada = this.npcs.create(x, y, "npc-ada-idle");

      ada.setOrigin(0.5, 1);
      ada.setDepth(10);

      if (!this.anims.exists("ada-idle-down")) {
        this.anims.create({
          key: "ada-idle-down",
          frames: this.anims.generateFrameNumbers(
            "npc-ada-idle",
            { start: 18, end: 23 },
          ),
          frameRate: 8,
          repeat: -1,
        });
      }

      ada.play("ada-idle-down");

      if (ada.body) {
        const width = 16;
        const height = 10;
        const offsetY = ada.height - height;

        ada.body.setSize(width, height);
        ada.body.setOffset(0, offsetY);
      }
    }
  }

  update() {
    if (this.isReading) {
      this.player.stopMovement();
      // REMOVIDO: handleDialogInput() - Agora a UIScene gerencia isso
    } else {
      this.player.update();
      this.handleInteractions();
    }
  }

  // =================================================================
  // LÓGICA DE INTERAÇÃO
  // =================================================================

  private createInteractionZones() {
    this.itemsZone = this.physics.add.staticGroup({
      classType: Phaser.GameObjects.Zone,
    });

    const objects = this.mapPort.getInteractionObjects();
    if (!objects) return;

    objects.forEach((obj) => {
      const width = obj.width || 32;
      const height = obj.height || 32;
      const x = (obj.x || 0) + width / 2;
      const y = (obj.y || 0) + height / 2;

      const zone = this.add.zone(x, y, width, height);
      zone.setData("tiledData", obj);
      this.itemsZone.add(zone);
    });
  }

  private handleInteractions() {
    this.currentInteractiveObject = null;
    let isOverlapping = false;

    this.physics.overlap(
      this.player,
      this.itemsZone,
      (player, zone) => {
        void player;
        this.currentInteractiveObject =
          zone as Phaser.GameObjects.Zone;
        isOverlapping = true;
      },
    );

    if (isOverlapping && this.currentInteractiveObject) {
      if (!this.interactionPrompt.visible) {
        this.interactionPrompt.setVisible(true);
        this.startPromptLoop();
      }

      const animOffset =
        this.interactionPrompt.getData("offsetY") || 0;
      this.interactionPrompt.setPosition(
        this.player.x,
        this.player.y - 24 + animOffset,
      );

      if (
        this.interactionInput.isInteractPressed() &&
        !this.isReading &&
        !this.isInteractionCooldown
      ) {
        this.triggerAction(this.currentInteractiveObject);
      }
    } else {
      if (this.interactionPrompt.visible) {
        this.interactionPrompt.setVisible(false);
        this.stopPromptLoop();
      }
    }
  }

  private triggerAction(zone: Phaser.GameObjects.Zone) {
    const data = zone.getData("tiledData");
    const type = this.getTiledProperty(data, "actionType");

    switch (type) {
      case "dialog":
        this.handleDialogInteraction(data);
        break;
      case "npc_ada":
        this.handleAdaInteraction();
        break;
      case "npc_buda":
        this.handleBudaInteraction();
        break;
      case "warp":
        this.handleWarpAction(data);
        break;
      default:
        console.warn(
          `Ação desconhecida para o tipo: ${type}`,
        );
    }
  }

  private handleAdaInteraction() {
    this.player.stopMovement();

    const playerName =
      localStorage.getItem("player_name") || "Bob";

    if (this.hasAppointment) {
      // Envia evento para UIScene mostrar o diálogo
      this.showDialogUseCase.execute(
        `[weight=900][color=#${COLORS.gold}]Ada[/color][/weight]: O elevador é logo ali à direita, [weight=900]${playerName}[/weight]. O chefe está te esperando no 2º andar.`,
        "[ ESPAÇO para fechar ]",
      );
    } else {
      this.hasAppointment = true;

      this.showDialogUseCase.execute(
        `[weight=900][color=#${COLORS.gold}]Ada[/color][/weight]: Ah, você deve ser o [weight=900]${playerName}[/weight}! Vou anunciar sua chegada.\nPode subir, acabei de liberar seu crachá para o 2º andar.`,
        "[ ESPAÇO para fechar ]",
      );
    }
  }

  private handleBudaInteraction() {
    this.player.stopMovement();

    const playerName =
      localStorage.getItem("player_name") || "Bob";

    this.showDialogUseCase.execute(
      `[weight=900][color=#${COLORS.gold}]Buda[/color][/weight]: Grande [weight=900]${playerName}[/weight]! Como vai?\nObrigado por visitar meu mundo. Fique à vontade para olhar meus projetos nos terminais.`,
      "[ ESPAÇO para fechar ]",
    );
  }

  private handleWarpAction(data: any) {
    const sceneProperties = {
      mapKey: this.getTiledProperty(data, "mapKey"),
      facingDirection: this.getTiledProperty(
        data,
        "facingDirection",
      ),
      targetScene: this.getTiledProperty(
        data,
        "targetScene",
      ),
      targetSpawn: this.getTiledProperty(
        data,
        "targetSpawn",
      ),
      requiresAccess: this.getTiledProperty(
        data,
        "requiresAccess",
      ),
    };

    if (
      sceneProperties.requiresAccess &&
      !this.hasAppointment
    ) {
      this.player.stopMovement();

      this.showDialogUseCase.execute(
        `[weight=900][color=#${COLORS.gold}]Segurança (Interfone)[/color][/weight]: ACESSO NEGADO.\nPor favor, identifique-se na recepção antes de subir.`,
        "[ ESPAÇO para fechar ]",
      );

      this.errorSound.play();
      return;
    }

    if (!this.warpUseCase.canWarp(sceneProperties)) return;

    this.doorOpenSound.play();
    this.warpUseCase.execute(sceneProperties);
  }

  private handleDialogInteraction(data: any) {
    const msg =
      this.getTiledProperty(data, "message") || "...";

    this.showDialogUseCase.execute(
      msg,
      "[ ESPAÇO para fechar ]",
    );
  }

  // REMOVIDO: handleDialogInput() - Não é mais necessário

  // =================================================================
  // HELPERS VISUAIS
  // =================================================================

  private startPromptLoop() {
    this.stopPromptLoop();
    this.tweens.add({
      targets: this.interactionPrompt,
      scaleY: 0.8,
      scaleX: 0.95,
      duration: 150,
      yoyo: true,
      repeat: -1,
      repeatDelay: 500,
      ease: "Quad.easeInOut",
      onUpdate: (
        tween,
        target: Phaser.GameObjects.Sprite,
      ) => {
        void tween;
        const currentScale = target.scaleY;
        const calculatedOffset = (1 - currentScale) * 10;
        target.setData("offsetY", calculatedOffset);
      },
    });
  }

  private stopPromptLoop() {
    this.tweens.killTweensOf(this.interactionPrompt);
    this.interactionPrompt.setScale(1);
    this.interactionPrompt.setData("offsetY", 0);
  }

  private getTiledProperty(
    obj: any,
    propName: string,
  ): any {
    if (!obj || !obj.properties) return null;
    if (Array.isArray(obj.properties)) {
      const prop = obj.properties.find(
        (p: any) => p.name === propName,
      );
      return prop ? prop.value : null;
    } else {
      return obj.properties[propName];
    }
  }

  /**
   * Cleanup quando a cena for destruída
   */
  shutdown() {
    // Remove listeners para evitar memory leaks
    this.game.events.off("dialog-finished");
  }
}
