export interface SettingsPort {
  getSettings(): any;
  updateSettings(newSettings: Partial<any>): void;
}
