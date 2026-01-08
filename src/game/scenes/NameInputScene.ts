import { Scene } from "phaser";

export class NameInputScene extends Scene {
  constructor() {
    super("NameInputScene");
  }

  create() {
    // 1. Fundo simples
    this.cameras.main.setBackgroundColor("#2d2d2d");

    // 2. Texto de instrução
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 150,
        "IDENTIFICAÇÃO",
        {
          fontSize: "64px",
          color: "#ffffff",
          fontFamily: "VT323, monospace",
          fontStyle: "normal",
        }
      )
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2 - 100,
        "Digite seu nome para o crachá:",
        {
          fontSize: "32px",
          color: "#aaaaaa",
          fontFamily: "VT323, monospace",
          fontStyle: "normal",
        }
      )
      .setOrigin(0.5);

    // 3. Cria o Elemento HTML de Input
    // O estilo CSS é inline para facilitar, mas poderia ser uma classe
    const element = this.add.dom(
      this.scale.width / 2,
      this.scale.height / 2
    ).createFromHTML(`
      <div style="display: flex; flex-direction: column; align-items: center;">
        <input type="text" name="nameField" style="text-transform: uppercase; font-family: VT323, monospace; font-style: normal; font-size: 30px; padding: 10px; width: 200px; text-align: center; border-radius: 5px; border: none;">
        <button name="playButton" style="margin-top: 20px; font-size: 20px; padding: 10px 30px; cursor: pointer; background-color: #4a90e2; color: white; border: none; border-radius: 5px;">ENTRAR</button>
      </div>
    `);

    // 4. Adiciona o Listener para o botão e ENTER
    element.addListener("click");
    element.on("click", (event: any) => {
      if (event.target.name === "playButton") {
        this.handleLogin(element);
      }
    });

    // Opcional: Aceitar tecla Enter
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.handleLogin(element);
    });
  }

  private handleLogin(
    element: Phaser.GameObjects.DOMElement
  ) {
    const input = element.getChildByName(
      "nameField"
    ) as HTMLInputElement;

    // Se não digitar nada, usa um padrão
    const name = input.value.trim() || "Bob";

    // --- O PULO DO GATO ---
    // Salvamos no REGISTRY (memória global do Phaser)
    this.registry.set("playerName", name.toUpperCase());

    // Inicia o jogo
    this.scene.start("MainScene", {
      mapKey: "hub", // Nome do JSON carregado na BootScene
      spawnName: "spawn_start", // Ponto onde o player nasce lá dentro
      facingDirection: "down",
    }); // Ou MainScene, dependendo de onde começa seu jogo
  }
}
