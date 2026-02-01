import Phaser from "phaser";

export class BootSceneLoadingView {
  constructor(private readonly scene: Phaser.Scene) {}

  attach(): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const progressBar = this.scene.add.graphics();
    const progressBox = this.scene.add.graphics();
    progressBox.fillStyle(0x444444, 1);
    progressBar.setDepth(1);
    progressBox
      .fillRect(width / 2 - 160, height / 2 - 25, 320, 50)
      .setDepth(0);

    const loadingText = this.scene.add
      .text(width / 2, height / 2 - 50, "Carregando...", {
        fontSize: "40px",
        fontFamily: "'VT323'",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(1);

    this.scene.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        width / 2 - 150,
        height / 2 - 15,
        300 * value,
        30,
      );
    });

    this.scene.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }
}
