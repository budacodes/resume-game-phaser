import { Scene } from "phaser";
import { UIScene } from "./UiScene";
import { Player } from "../../entities/Player";
import { MapManager } from "../../systems/MapManager";

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
  private isIntro: boolean = false;

  private refuseCount: number = 0;
  private isPlayerReady: boolean = false;

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
    this.mapManager = new MapManager(this);
    this.mapManager.init("hub");

    this.scene.launch("UIScene");

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
      this.setupIntro();
    });
  }

  private createPlayer() {
    const spawn = this.mapManager.getSpawnPoint(
      this.targetSpawn
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
      playerSprite
    );

    if (this.uiScene) {
      this.player.setUIScene(this.uiScene);
    }

    this.player.setFacing(this.facingDirection);

    if (this.mapManager.colliders.length > 0) {
      this.physics.add.collider(
        this.player,
        this.mapManager.colliders
      );
    }

    this.cameras.main.startFollow(
      this.player,
      true,
      0.09,
      0.09
    );
  }

  private setupIntro() {
    const hasSeenIntro = this.registry.get("hasSeenIntro");

    if (!hasSeenIntro) {
      this.time.delayedCall(1000, () => {
        this.isReading = true;
        this.isQuestionMode = true;
        this.isIntro = true;

        const playerName =
          this.registry.get("playerName") || "Bob";

        this.game.events.emit(
          "show-dialog",
          `SISTEMA: LOGIN EFETUADO COM SUCESSO!\n\n` +
            `Bem-vindo ao Hub Central, ${playerName}.\n\n` +
            `Este mundo virtual é uma representação interativa da minha carreira. ` +
            `Cada prédio aqui conecta a um projeto ou habilidade diferente.\n\n` +
            `Sinta-se livre para explorar, coletar referências e... se achar algum bug, considere uma "feature" não documentada.\n\n` +
            `Está pronto para começar?\n\n` +
            `[Y] Sim [N] Não`,
          280,
          400
        );

        this.registry.set("hasSeenIntro", true);
      });
    }
  }

  update() {
    if (!this.isPlayerReady) return;

    if (this.isQuestionMode) {
      this.handleQuestionInput();
      return;
    }

    if (this.isReading) {
      this.player.stopMovement();
      this.handleDialogInput();
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

    if (this.input.keyboard) {
      this.keyE = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );
      this.keyY = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.Y
      );
      this.keyN = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.N
      );
    }

    this.interactionPrompt = this.add
      .sprite(0, 0, "btn-e")
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
        height + padding
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
        target: Phaser.GameObjects.Sprite
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
      }
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
        this.player.y - 15 + animOffset
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
      case "warp":
        this.handleWarpAction(data);
        break;
      default:
        console.warn(
          `Ação desconhecida para o tipo: ${type}`
        );
    }
  }

  private handleWarpAction(data: any) {
    const sceneProperties = {
      mapKey: this.getTiledProperty(data, "mapKey"),
      facingDirection: this.getTiledProperty(
        data,
        "facingDirection"
      ),
      targetScene: this.getTiledProperty(
        data,
        "targetScene"
      ),
      targetSpawn: this.getTiledProperty(
        data,
        "targetSpawn"
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
        }
      );
    }
  }

  private handleDialogInteraction(data: any) {
    const msg =
      this.getTiledProperty(data, "message") || "...";
    this.isReading = true;
    this.game.events.emit("show-dialog", msg);
  }

  private handleFountainInteraction() {
    this.isQuestionMode = true;
    this.isReading = true;
    this.game.events.emit(
      "show-dialog",
      "A fonte emite uma aura estranha...\nDeseja jogar uma moeda?\n\n[Y] Sim [N] Não"
    );
  }

  private handleDialogInput() {
    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.isReading = false;
      this.game.events.emit("hide-dialog");
    }
  }

  private handleQuestionInput() {
    if (Phaser.Input.Keyboard.JustDown(this.keyY)) {
      if (this.isIntro) {
        this.game.events.emit("hide-dialog");
        this.isQuestionMode = false;
        this.isReading = false;
        this.isIntro = false;
      } else {
        this.coinSound.play();
        setTimeout(() => {
          this.waterDropSound.play();
        }, 400);

        this.game.events.emit(
          "show-dialog",
          "Você fez um pedido silencioso..."
        );
        this.isQuestionMode = false;
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
      const playerName =
        this.registry.get("playerName") || "Bob";

      if (this.isIntro) {
        if (this.refuseCount > 5) {
          this.game.events.emit(
            "show-dialog",
            "OK, você venceu...",
            80,
            300
          );

          setTimeout(() => {
            window.location.href =
              "https://github.com/budacodes";
          }, 3000);
        } else {
          this.refuseCount++;

          this.game.events.emit(
            "show-dialog",
            `(${playerName}, vamo lá... me ajuda aqui... não estraga a imersão...)\n\n` +
              `Está pronto para começar?\n\n` +
              `[Y] Sim [N] Não`,
            120,
            300
          );
        }
      } else {
        this.game.events.emit("hide-dialog");
        this.isQuestionMode = false;
        this.isReading = false;
        this.isIntro = false;
      }
    }
  }

  private getTiledProperty(
    obj: any,
    propName: string
  ): any {
    if (!obj || !obj.properties) return null;
    if (Array.isArray(obj.properties)) {
      const prop = obj.properties.find(
        (p: any) => p.name === propName
      );
      return prop ? prop.value : null;
    } else {
      return obj.properties[propName];
    }
  }
}
