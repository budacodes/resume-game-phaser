import { Scene } from "phaser";

export class DialogBox extends Phaser.GameObjects
  .Container {
  private box: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;

  private typingSpeed = 30;
  private eventTimer?: Phaser.Time.TimerEvent;
  private targetText: string = "";
  private currentText: string = "";
  private charIndex: number = 0;

  constructor(scene: Scene) {
    super(scene, 0, 0);
    this.setName("DialogBox");

    // 1. Cria os objetos UMA VEZ SÓ aqui no construtor
    this.box = new Phaser.GameObjects.Graphics(scene);
    this.add(this.box);

    this.text = new Phaser.GameObjects.Text(
      scene,
      0,
      0,
      "",
      {
        fontFamily: "VT323",
        fontSize: "14px",
        color: "#ffffff",
        wordWrap: { width: 100 }, // Valor inicial, será atualizado no show
      }
    );
    this.add(this.text);

    this.setVisible(false);
    scene.add.existing(this);
  }

  // Método auxiliar para desenhar o fundo (não cria novos objetos, só desenha)
  private updateBoxGeometry(
    width: number,
    height: number
  ): void {
    this.box.clear(); // <--- OBRIGATÓRIO: Limpa o desenho anterior

    this.box.fillStyle(0x000000, 0.9);
    this.box.lineStyle(2, 0xffffff, 1);

    // Desenha centrado no container
    const x = 0;
    const y = -height + height / 2; // Ajuste baseado na sua lógica anterior

    this.box.fillRoundedRect(x, y, width, height, 5);
    this.box.strokeRoundedRect(x, y, width, height, 5);

    // Reposiciona e redimensiona o texto
    this.text.setPosition(x + 10, y + 10);
    this.text.setStyle({ wordWrap: { width: width - 20 } });
  }

  public show(
    message: string,
    width: number = 300,
    height: number = 100
  ) {
    // 1. Atualiza o visual
    this.updateBoxGeometry(width, height);

    // 2. Reseta lógica
    this.cleanup();
    this.targetText = message;
    this.currentText = "";
    this.charIndex = 0;
    this.text.setText(""); // Começa vazio

    this.setVisible(true);

    // 3. Timer
    this.eventTimer = this.scene.time.addEvent({
      delay: this.typingSpeed,
      callback: this.typeNextChar,
      callbackScope: this,
      loop: true,
    });
  }

  private typeNextChar() {
    if (this.charIndex >= this.targetText.length) {
      this.cleanup();
      return;
    }

    const nextChar = this.targetText[this.charIndex];
    this.currentText += nextChar;
    this.text.setText(this.currentText);
    this.charIndex++;
  }

  public hide() {
    this.cleanup();
    this.setVisible(false);
  }

  private cleanup() {
    if (this.eventTimer) {
      this.eventTimer.remove();
      this.eventTimer = undefined;
    }
  }
}
