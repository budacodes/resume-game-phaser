import { SettingsPort } from "../../application/ports/SettingsPort";
import { SettingsManager } from "../../managers/SettingsManager";

export class SettingsManagerAdapter implements SettingsPort {
  constructor(private readonly manager: SettingsManager) {}

  getSettings(): any {
    return this.manager.getSettings();
  }

  updateSettings(newSettings: Partial<any>): void {
    this.manager.updateSettings(newSettings);
  }
}
