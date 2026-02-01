import { Scene } from "phaser";
import { Player } from "../../entities/Player";
import { UIScene } from "./ui/UiScene";
import { CollectItemUseCase } from "../../application/usecases/CollectItemUseCase";
import { FountainInteractionUseCase } from "../../application/usecases/FountainInteractionUseCase";
import { InsanosFlagUseCase } from "../../application/usecases/InsanosFlagUseCase";
import { ShowDialogUseCase } from "../../application/usecases/ShowDialogUseCase";
import { WarpUseCase } from "../../application/usecases/WarpUseCase";
import { PhaserInteractionInput } from "../../infrastructure/adapters/PhaserInteractionInput";
import { PhaserDialogEventAdapter } from "../../infrastructure/adapters/PhaserDialogEventAdapter";
import { PhaserTimeScheduler } from "../../infrastructure/adapters/PhaserTimeScheduler";
import { AudioPort } from "../../application/ports/AudioPort";
import { MainSceneComposition } from "../../composition/MainSceneComposition";
import { MapPort } from "../../application/ports/MapPort";
import { CursorPort } from "../../application/ports/CursorPort";

export class MainScene extends Scene {
  private player!: Player;
  private mapPort!: MapPort;
  private cursor!: CursorPort;
  private uiScene!: UIScene;

  private interactionInput!: PhaserInteractionInput;

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

  private collectItemUseCase!: CollectItemUseCase;
  private fountainInteractionUseCase!: FountainInteractionUseCase;
  private insanosFlagUseCase!: InsanosFlagUseCase;
  private showDialogUseCase!: ShowDialogUseCase;
  private warpUseCase!: WarpUseCase;
  private dialogEventAdapter!: PhaserDialogEventAdapter;
  private timeScheduler!: PhaserTimeScheduler;

  private audio!: AudioPort;

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
    const composition = new MainSceneComposition(this).build({
      onStarted: () => {
        this.isReading = true;
      },
      onFinished: () => {
        this.isReading = false;
        this.isQuestionMode = false;
      },
    });

    this.mapPort = composition.mapPort;
    this.mapPort.init("hub");
    this.cursor = composition.cursor;

    this.audio = composition.audio;
    this.collectItemUseCase = composition.collectItemUseCase;
    this.fountainInteractionUseCase =
      composition.fountainInteractionUseCase;
    this.insanosFlagUseCase = composition.insanosFlagUseCase;
    this.showDialogUseCase = composition.showDialogUseCase;
    this.warpUseCase = composition.warpUseCase;
    this.interactionInput = composition.interactionInput;
    this.dialogEventAdapter = composition.dialogEventAdapter;
    this.timeScheduler = composition.timeScheduler;

    this.game.events.emit("scene-changed", "MainScene");

    this.game.events.emit("enable-joystick");

    this.timeScheduler.delay(100, () => {
      if (this.scene.isActive("UIScene")) {
        this.uiScene = this.scene.get("UIScene") as UIScene;
      }

      this.createPlayer();
      this.createInteractionZones();
      this.initAudioAndInputs();
      this.isPlayerReady = true;
    });

    this.cursor.setState("default");

    this.dialogEventAdapter.subscribe();
  }

  private createPlayer() {
    const spawn = this.mapPort.getSpawnPoint(
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

    if (this.mapPort.getColliders().length > 0) {
      this.physics.add.collider(
        this.player,
        this.mapPort.getColliders(),
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

    if (!this.interactionInput) {
      this.interactionInput = new PhaserInteractionInput(
        this,
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

    const objects = this.mapPort.getInteractionObjects();
    if (!objects) return;

    objects.forEach((obj) => {
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

  private handleInteractions() {
    if (!this.player) return;

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

      if (this.interactionInput.isInteractPressed() &&
        !this.isReading) {
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
    this.collectItemUseCase.execute("coin", {
      alreadyHaveText: "Não há nada aqui...",
      obtainedText: "Você encontrou uma moeda!",
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

    if (!this.warpUseCase.canWarp(sceneProperties)) return;

    this.doorOpenSound.play();
    this.warpUseCase.execute(sceneProperties);
  }

  private handleDialogInteraction(data: any) {
    const msg =
      this.getTiledProperty(data, "message") || "...";
    this.showDialogUseCase.execute(msg);
  }

  private handleFountainInteraction() {
    this.isQuestionMode =
      this.fountainInteractionUseCase.startInteraction();
  }

  private handleInsanosFlagInteraction(
    zone: Phaser.GameObjects.Zone,
  ) {
    if (!this.insanosFlagUseCase.start()) return;

    // Para o player brevemente
    this.player.stopMovement();

    // Abaixa música atual
    this.audio.fadeOutMusic(600);

    this.timeScheduler.delay(600, () => {
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

      this.insanosFlagUseCase.showIntroDialog();
    });

    this.timeScheduler.delay(6000, () => {
      this.insanosFlagUseCase.complete();
      this.audio.fadeInMusic("bgm_hub", 3000);
    });

    // Nunca mais dispara
    zone.destroy();
  }

  private handleFountainQuestionInput() {
    if (this.interactionInput.isYesPressed()) {
      this.coinSound.play();
      setTimeout(() => this.waterDropSound.play(), 400);

      this.fountainInteractionUseCase.answerYes();
    }

    if (this.interactionInput.isNoPressed()) {
      this.fountainInteractionUseCase.answerNo();
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
