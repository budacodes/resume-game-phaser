import { Scene } from "phaser";
import { DEPTH } from "../config/Layers";
import { UIScene } from "../game/scenes/UiScene";

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private speed: number = 100;
  private lastDirection: "down" | "up" | "right" | "left" =
    "down";
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private uiScene: UIScene | null = null;

  // Teclas WASD
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    spriteKey?: string
  ) {
    // Use o spriteKey passado ou pegue do registry com fallback
    const spriteToUse =
      spriteKey ||
      scene.registry.get("playerSprite") ||
      "male-run";

    super(scene, x, y, spriteToUse, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(DEPTH.PLAYER);

    // Hitbox padrão para todos (ajuste conforme necessidade)
    this.body?.setSize(10, 20);
    this.body?.setOffset(1.5, 8);

    this.setupInput(scene);
    this.createAnimations(spriteToUse);
    this.setFacing("down");
  }

  private setupInput(scene: Scene) {
    if (scene.input.keyboard) {
      this.cursors =
        scene.input.keyboard.createCursorKeys();

      this.keyW = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.W
      );
      this.keyA = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.A
      );
      this.keyS = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.S
      );
      this.keyD = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.D
      );
    }
  }

  public setFacing(
    direction: "up" | "down" | "right" | "left"
  ) {
    this.lastDirection = direction;
    this.anims.stop();
    this.setStaticFrame(direction);
  }

  public setUIScene(uiScene: UIScene) {
    this.uiScene = uiScene;
  }

  update() {
    this.handleMovement();
  }

  public stopMovement() {
    this.body?.setVelocity(0);
    this.setStaticFrame(this.lastDirection);
  }

  private handleMovement() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let velocityX = 0;
    let velocityY = 0;

    // Setas
    if (this.cursors?.left.isDown) velocityX = -1;
    else if (this.cursors?.right.isDown) velocityX = 1;

    if (this.cursors?.up.isDown) velocityY = -1;
    else if (this.cursors?.down.isDown) velocityY = 1;

    // WASD
    if (this.keyA?.isDown) velocityX = -1;
    else if (this.keyD?.isDown) velocityX = 1;

    if (this.keyW?.isDown) velocityY = -1;
    else if (this.keyS?.isDown) velocityY = 1;

    // Joystick
    if (this.uiScene && this.uiScene.joystickCursorKeys) {
      const joy = this.uiScene.joystickCursorKeys;
      if (joy.left.isDown) velocityX = -1;
      else if (joy.right.isDown) velocityX = 1;

      if (joy.up.isDown) velocityY = -1;
      else if (joy.down.isDown) velocityY = 1;
    }

    const vector = new Phaser.Math.Vector2(
      velocityX,
      velocityY
    ).normalize();
    body.setVelocity(
      vector.x * this.speed,
      vector.y * this.speed
    );

    const isMoving =
      body.velocity.x !== 0 || body.velocity.y !== 0;

    if (isMoving) {
      if (
        Math.abs(body.velocity.x) >
        Math.abs(body.velocity.y)
      ) {
        // Movimento horizontal
        if (body.velocity.x > 0) {
          this.play("run-right", true);
          this.setFlipX(false);
          this.lastDirection = "right";
        } else {
          this.play("run-left", true);
          this.setFlipX(false);
          this.lastDirection = "left";
        }
      } else {
        // Movimento vertical
        this.setFlipX(false);
        if (body.velocity.y > 0) {
          this.play("run-down", true);
          this.lastDirection = "down";
        } else {
          this.play("run-up", true);
          this.lastDirection = "up";
        }
      }
    } else {
      this.setStaticFrame(this.lastDirection);
    }
  }

  private setStaticFrame(
    direction: "down" | "up" | "right" | "left"
  ) {
    this.anims.stop();

    // Usa o primeiro frame de cada animação como frame estático
    switch (direction) {
      case "down":
        this.setFrame(6); // Primeiro frame da animação "down"
        break;
      case "right":
        this.setFrame(3); // Primeiro frame da animação "right"
        break;
      case "up":
        this.setFrame(0); // Primeiro frame da animação "up"
        break;
      case "left":
        this.setFrame(9); // Primeiro frame da animação "left"
        break;
    }
  }

  private createAnimations(spriteKey: string) {
    const anims = this.scene.anims;

    anims.create({
      key: "run-up",
      frames: anims.generateFrameNumbers(spriteKey, {
        start: 0,
        end: 2,
      }),
      frameRate: 9,
      repeat: -1,
    });

    // 2. DIREITA - frames 3, 4, 5
    anims.create({
      key: "run-right",
      frames: anims.generateFrameNumbers(spriteKey, {
        start: 3,
        end: 5,
      }),
      frameRate: 9,
      repeat: -1,
    });

    // 3. BAIXO - frames 6, 7, 8
    anims.create({
      key: "run-down",
      frames: anims.generateFrameNumbers(spriteKey, {
        start: 6,
        end: 8,
      }),
      frameRate: 9,
      repeat: -1,
    });

    // 4. ESQUERDA - frames 9, 10, 11
    anims.create({
      key: "run-left",
      frames: anims.generateFrameNumbers(spriteKey, {
        start: 9,
        end: 11,
      }),
      frameRate: 9,
      repeat: -1,
    });
  }
}
