import { Scene } from "phaser";
import { Player } from "../../entities/Player";
import { CursorManager } from "../../managers/CursorManager";
import { MapManager } from "../../managers/MapManager";
import { UIScene } from "./ui/UiScene";
import { InventoryManager } from "../../managers/InventoryManager";
import { AudioManager } from "../../managers/AudioManager";

export class MainScene extends Scene {
  private player!: Player;
  private mapManager!: MapManager;
  private uiScene!: UIScene;

  private keyE!: Phaser.Input.Keyboard.Key;
  private keyY!: Phaser.Input.Keyboard.Key;
  private keyN!: Phaser.Input.Keyboard.Key;

  private coinSound!: Phaser.Sound.BaseSound;
  private waterDropSound!: Phaser.Sound.BaseSound;
  private doorOpenSound!: Phaser.Sound.BaseSound;
  // private bgm!: Phaser.Sound.BaseSound;

  private itemsZone!: Phaser.Physics.Arcade.StaticGroup;
  private currentInteractiveObject: Phaser.GameObjects.Zone | null =
    null;
  private interactionPrompt!: Phaser.GameObjects.Sprite;

  private isReading: boolean = false;
  private isQuestionMode: boolean = false;
  private targetSpawn: string = "spawn_start";
  private facingDirection:
    | "up"
    | "down"
    | "right"
    | "left" = "down";
  private isPlayerReady: boolean = false;

  private inventoryManager!: InventoryManager;

  private audio!: AudioManager;

  constructor() {
    super("MainScene");
  }

  init(data: {
    spawnName?: string;
    facingDirection?: "up" | "down" | "right" | "left";
  }) {
    this.targetSpawn = data.spawnName || "spawn_start";
    this.facingDirection = data.facingDirection || "down";
  }

  create() {
    this.audio = AudioManager.getInstance(this);

    this.mapManager = new MapManager(this);
    this.mapManager.init("hub");

    this.inventoryManager = InventoryManager.getInstance();

    this.game.events.emit("scene-changed", "MainScene");

    this.game.events.emit("enable-joystick");

    this.time.delayedCall(100, () => {
      if (this.scene.isActive("UIScene")) {
        this.uiScene = this.scene.get("UIScene") as UIScene;
      }

      this.createPlayer();
      this.createInteractionZones();
      this.initAudioAndInputs();
      this.isPlayerReady = true;
    });

    const cursor = CursorManager.getInstance();
    cursor.setState("default");

    this.game.events.on("dialog-started", () => {
      this.isReading = true;
    });

    this.game.events.on("dialog-finished", () => {
      this.isReading = false;
      this.isQuestionMode = false;
    });
  }

  private createPlayer() {
    const spawn = this.mapManager.getSpawnPoint(
      this.targetSpawn,
    ) || {
      x: 100,
      y: 100,
    };

    // Pega o sprite do registry - IMPORTANTE: deve ser um dos 3
    const playerSprite =
      this.registry.get("playerSprite") || "male-run";

    // Passa o spriteKey para o Player
    this.player = new Player(
      this,
      spawn.x,
      spawn.y,
      playerSprite,
    );

    if (this.uiScene) {
      this.player.setUIScene(this.uiScene);
    }

    this.player.setFacing(this.facingDirection);

    if (this.mapManager.colliders.length > 0) {
      this.physics.add.collider(
        this.player,
        this.mapManager.colliders,
      );
    }

    this.cameras.main.startFollow(
      this.player,
      true,
      0.09,
      0.09,
    );
  }

  update() {
    if (!this.isPlayerReady) return;

    if (this.isQuestionMode) {
      this.handleFountainQuestionInput();
      return;
    }

    if (this.isReading) {
      this.player.stopMovement();
    } else {
      if (this.player) {
        this.player.update();
      }

      this.handleInteractions();
    }
  }

  private initAudioAndInputs() {
    this.coinSound = this.sound.add("snd_coin", {
      volume: 0.5,
    });

    this.waterDropSound = this.sound.add("snd_water_drop", {
      volume: 1,
    });

    this.doorOpenSound = this.sound.add("snd_door_open", {
      volume: 1,
      seek: 3,
    });

    // this.bgm.play();
    this.audio.playMusic("bgm_hub", {
      volume: 1,
      loop: true,
    });

    if (this.input.keyboard) {
      this.keyE = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E,
      );
      this.keyY = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.Y,
      );
      this.keyN = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.N,
      );
    }

    this.interactionPrompt = this.add
      .sprite(0, -56, "btn-e")
      .setDepth(100)
      .setVisible(false);
  }

  private createInteractionZones() {
    this.itemsZone = this.physics.add.staticGroup({
      classType: Phaser.GameObjects.Zone,
    });

    const layer = this.mapManager.interactionLayer;
    if (!layer) return;

    layer.objects.forEach((obj) => {
      const width = obj.width || 32;
      const height = obj.height || 32;
      const x = (obj.x || 0) + width / 2;
      const y = (obj.y || 0) + height / 2;
      const padding = 20;

      const zone = this.add.zone(
        x,
        y,
        width + padding,
        height + padding,
      );
      zone.setData("tiledData", obj);
      this.itemsZone.add(zone);
    });
  }

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

  private handleInteractions() {
    if (!this.player) return;

    this.currentInteractiveObject = null;
    let isOverlapping = false;

    this.physics.overlap(
      this.player,
      this.itemsZone,
      (player, zone) => {
        this.currentInteractiveObject =
          zone as Phaser.GameObjects.Zone;
        isOverlapping = true;
      },
    );

    const actionType = this.getTiledProperty(
      this.currentInteractiveObject?.getData("tiledData"),
      "actionType",
    );

    const isSilentInteraction =
      actionType === "insanos_flag";

    if (isOverlapping && this.currentInteractiveObject) {
      if (isSilentInteraction) {
        this.handleInsanosFlagInteraction(
          this.currentInteractiveObject,
        );
        return;
      }

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
        Phaser.Input.Keyboard.JustDown(this.keyE) &&
        !this.isReading
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
    const type =
      this.getTiledProperty(data, "actionType") || "dialog";

    switch (type) {
      case "dialog":
        this.handleDialogInteraction(data);
        break;
      case "fountain":
        this.handleFountainInteraction();
        break;
      case "found_coin":
        this.handleFoundCoinInteraction();
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

  private handleFoundCoinInteraction() {
    if (this.inventoryManager.hasItem("coin")) {
      this.game.events.emit("dialog-started", {
        text: "Não há nada aqui...",
        hint: "[ ESPAÇO para fechar ]",
        mode: "read",
      });

      return;
    }

    this.inventoryManager.obtainItem("coin");

    this.game.events.emit("dialog-started", {
      text: "Você encontrou uma moeda!",
      hint: "[ ESPAÇO para fechar ]",
      mode: "read",
    });
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
    };

    if (sceneProperties.targetScene) {
      this.doorOpenSound.play();
      this.cameras.main.fadeOut(1000, 0, 0, 0);

      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start(sceneProperties.targetScene, {
            mapKey: sceneProperties.mapKey,
            spawnName: sceneProperties.targetSpawn,
            facingDirection:
              sceneProperties.facingDirection,
          });
        },
      );
    }
  }

  private handleDialogInteraction(data: any) {
    const msg =
      this.getTiledProperty(data, "message") || "...";
    this.game.events.emit("dialog-started");
    this.game.events.emit("show-dialog", msg);
  }

  private handleFountainInteraction() {
    if (this.inventoryManager.hasItem("coin")) {
      this.isQuestionMode = true;

      this.game.events.emit("dialog-started", {
        text: "A fonte emite uma aura estranha...\nDeseja jogar uma moeda?\n\n[Y] Sim [N] Não",
        mode: "question",
      });
    } else {
      this.game.events.emit("dialog-started", {
        text: "A fonte emite uma aura estranha...\nParece até pedir algo...",
        hint: "[ ESPAÇO para fechar ]",
        mode: "read",
      });
    }
  }

  private handleInsanosFlagInteraction(
    zone: Phaser.GameObjects.Zone,
  ) {
    // Segurança extra
    if (this.registry.get("insanos_flag_seen")) return;

    this.registry.set("insanos_flag_seen", true);

    // Para o player brevemente
    this.player.stopMovement();

    // Abaixa música atual
    this.audio.fadeOutMusic(600);

    this.time.delayedCall(600, () => {
      console.log("tocou fx");
      this.audio.playSFX("snd_flag", {
        volume: 1.5,
      });

      this.audio.playSFX("snd_motorcycle", {
        volume: 0.8,
      });

      this.audio.playSFX("snd_wind", {
        volume: 1.5,
      });

      this.game.events.emit("dialog-started", {
        text: "Algumas bandeiras não se explicam.",
        mode: "read",
      });
    });

    this.time.delayedCall(6000, () => {
      this.inventoryManager.obtainItem("issi_pin");

      this.game.events.emit("hide-dialog");

      this.audio.fadeInMusic("bgm_hub", 3000);
    });

    // Nunca mais dispara
    zone.destroy();
  }

  private handleFountainQuestionInput() {
    if (Phaser.Input.Keyboard.JustDown(this.keyY)) {
      this.coinSound.play();
      setTimeout(() => this.waterDropSound.play(), 400);

      this.inventoryManager.removeItem("coin");

      this.game.events.emit("dialog-started", {
        hint: "[ ESPAÇO para fechar ]",
        text: "Você fez um pedido silencioso...",
      });
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
      this.game.events.emit("hide-dialog");
    }
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
}
