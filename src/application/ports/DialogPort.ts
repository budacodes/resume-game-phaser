export type DialogMode = "read" | "question";

export interface DialogData {
  text: string;
  hint?: string;
  mode?: DialogMode;
}

export interface DialogPort {
  show(dialog: DialogData): void;
  hide(): void;
}
