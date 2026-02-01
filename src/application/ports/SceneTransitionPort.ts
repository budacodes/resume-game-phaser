export interface SceneTransitionPort {
  fadeOutAndStart(
    targetScene: string,
    data: Record<string, unknown>,
    durationMs?: number,
  ): void;
}
