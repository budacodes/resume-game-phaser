export interface FlagRepository {
  hasSeen(flagId: string): boolean;
  markSeen(flagId: string): void;
}
