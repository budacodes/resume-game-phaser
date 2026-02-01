export interface ItemAnimationConfig {
  texture: string; // spritesheet já carregada
  animationKey: string; // nome da animação
  startFrame: number;
  endFrame: number;
  frameRate?: number;
  repeat?: number;
  yoyo?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  obtained: boolean;
  canBeDropped: boolean;
  canBeUsed: boolean;
  iconFrame?: number;
  iconTexture?: string;
  animation?: ItemAnimationConfig;
}
