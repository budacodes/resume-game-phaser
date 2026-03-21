export type InteractionContextType =
  | "fountain"
  | "none";

export interface InteractionContext {
  type: InteractionContextType;
}