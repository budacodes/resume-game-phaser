import Phaser from "phaser";

export class BootSceneComposition {
  constructor(private readonly scene: Phaser.Scene) {}

  launchUIScene(): void {
    this.scene.scene.launch("UIScene");
    this.scene.scene.bringToTop("UIScene");
  }
}
