import { DialogMode } from "../types/DialogTypes";

export interface DialogPayload {
  text: string;
  hint?: string | null;
  mode?: DialogMode;
}
