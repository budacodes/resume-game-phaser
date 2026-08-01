import Phaser from "phaser";

export type CarDirection = "left" | "right" | "up" | "down";

export class Car extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 50;
  private direction: CarDirection = "right";

  private directions: CarDirection[] = [
    "left",
    "right",
    "up",
    "down",
  ];

  private decisionCooldown: number = 0;

  private roadLayer: Phaser.Tilemaps.TilemapLayer;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    roadLayer: Phaser.Tilemaps.TilemapLayer,
  ) {
    super(scene, x, y, texture);

    this.roadLayer = roadLayer;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    // hitbox
    this.setSize(20, 10);
    this.setOffset(6, 10);
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  setDirection(direction: CarDirection) {
    this.direction = direction;
  }

  update() {
    this.move();
    this.updateRotation();

    // reduz cooldown
    if (this.decisionCooldown > 0) {
      this.decisionCooldown--;
      return;
    }

    // bateu
    if (
      this.body.blocked.left ||
      this.body.blocked.right ||
      this.body.blocked.up ||
      this.body.blocked.down
    ) {
      this.chooseNewDirection();
      this.decisionCooldown = 20; // 👈 trava decisão
      return;
    }

    // só decide se estiver num "cruzamento"
    if (this.isAtDecisionPoint()) {
      this.chooseNewDirection();
      this.decisionCooldown = 20;
    }
  }

  private isAtDecisionPoint(): boolean {
    const options = this.directions.filter((dir) =>
      this.isDirectionValid(dir),
    );

    // se tem mais de 2 caminhos → cruzamento
    return options.length >= 3;
  }

  private move() {
    switch (this.direction) {
      case "left":
        this.setVelocity(-this.speed, 0);
        break;
      case "right":
        this.setVelocity(this.speed, 0);
        break;
      case "up":
        this.setVelocity(0, -this.speed);
        break;
      case "down":
        this.setVelocity(0, this.speed);
        break;
    }
  }

  private isOnRoad(): boolean {
    const tile = this.roadLayer.getTileAtWorldXY(
      this.x,
      this.y,
    );

    return tile !== null;
  }

  private getOppositeDirection(
    dir: CarDirection,
  ): CarDirection {
    switch (dir) {
      case "left":
        return "right";
      case "right":
        return "left";
      case "up":
        return "down";
      case "down":
        return "up";
    }
  }

  private chooseNewDirection() {
    const opposite = this.getOppositeDirection(
      this.direction,
    );

    // 👇 DIREÇÕES PERPENDICULARES (virar rua)
    const perpendiculars = this.getPerpendicularDirections(
      this.direction,
    );

    // tenta virar primeiro (comportamento natural)
    let possible = perpendiculars.filter((dir) =>
      this.isDirectionValid(dir),
    );

    if (possible.length > 0) {
      const newDir =
        possible[
          Math.floor(Math.random() * possible.length)
        ];

      this.direction = newDir;
      return;
    }

    // 👇 se não conseguiu virar, tenta continuar reto
    if (this.isDirectionValid(this.direction)) {
      return;
    }

    // 👇 último caso: volta (beco sem saída)
    this.direction = opposite;
  }

  private getPerpendicularDirections(
    dir: CarDirection,
  ): CarDirection[] {
    if (dir === "left" || dir === "right") {
      return ["up", "down"];
    }

    return ["left", "right"];
  }

  private isDirectionValid(
    direction: CarDirection,
  ): boolean {
    const distance = 32;

    let x = this.x;
    let y = this.y;

    switch (direction) {
      case "left":
        x -= distance;
        break;
      case "right":
        x += distance;
        break;
      case "up":
        y -= distance;
        break;
      case "down":
        y += distance;
        break;
    }

    const tile = this.roadLayer.getTileAtWorldXY(x, y);

    return tile !== null;
  }

  private updateRotation() {
    switch (this.direction) {
      case "right":
        this.setAngle(0);
        break;
      case "left":
        this.setAngle(180);
        break;
      case "up":
        this.setAngle(-90);
        break;
      case "down":
        this.setAngle(90);
        break;
    }
  }
}
