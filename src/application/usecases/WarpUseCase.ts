import { SceneTransitionPort } from "../ports/SceneTransitionPort";

type FacingDirection = "up" | "down" | "right" | "left";

export interface WarpRequest {
  targetScene?: string | null;
  mapKey?: string | null;
  targetSpawn?: string | null;
  facingDirection?: FacingDirection | null;
}

export class WarpUseCase {
  constructor(private readonly transition: SceneTransitionPort) {}

  canWarp(request: WarpRequest): boolean {
    return Boolean(request.targetScene);
  }

  execute(request: WarpRequest): void {
    if (!request.targetScene) return;

    this.transition.fadeOutAndStart(
      request.targetScene,
      {
        mapKey: request.mapKey ?? undefined,
        spawnName: request.targetSpawn ?? undefined,
        facingDirection: request.facingDirection ?? undefined,
      },
      1000,
    );
  }
}
