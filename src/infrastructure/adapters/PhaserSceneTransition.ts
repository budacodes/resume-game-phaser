import Phaser from "phaser";
import { SceneTransitionPort } from "../../application/ports/SceneTransitionPort";

export class PhaserSceneTransition implements SceneTransitionPort {
  constructor(private readonly scene: Phaser.Scene) {}

  fadeOutAndStart(
    targetScene: string,
    data: Record<string, unknown>,
    durationMs = 1000,
  ): void {
    this.scene.cameras.main.fadeOut(durationMs, 0, 0, 0);
    this.scene.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.scene.start(targetScene, data);
      },
    );
  }
}
