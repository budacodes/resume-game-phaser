import { DialogPort } from "../ports/DialogPort";

export class ShowDialogUseCase {
  constructor(private readonly dialog: DialogPort) {}

  execute(text: string, hint?: string): void {
    this.dialog.show({
      text,
      hint,
      mode: "read",
    });
  }
}
