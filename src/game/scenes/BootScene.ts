import { Scene } from "phaser";

export class BootScene extends Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.plugin(
      "rexvirtualjoystickplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js",
      true
    );

    // CORREÇÃO: Verifique se estes arquivos EXISTEM nas pastas
    // Se não existirem, comente ou remova estas linhas
    this.load.image(
      "male-face",
      "assets/sprites/faces/male-face.png"
    );
    this.load.image(
      "female-face",
      "assets/sprites/faces/female-face.png"
    );
    this.load.image(
      "nonbinary-face",
      "assets/sprites/faces/nonbinary-face.png"
    );

    // CORREÇÃO: Verifique se frame-gold.png existe
    this.load.image(
      "frame-gold",
      "assets/ui/frame-gold.png"
    );

    this.load.image("btn-e", "assets/ui/key_e.png");
    this.load.image(
      "icon_sound_on",
      "assets/ui/icon_sound_on.png"
    );
    this.load.image(
      "icon_sound_off",
      "assets/ui/icon_sound_off.png"
    );

    this.load.image("img_signs", "assets/map/signs.png");
    this.load.image(
      "tiles_interiors",
      "assets/map/interiors.png"
    );
    this.load.image("tiles_builder", "assets/map/room.png");
    this.load.image("tiles_urban", "assets/map/urban.png");

    this.load.tilemapTiledJSON(
      "hub",
      "assets/map/hub.json"
    );
    this.load.tilemapTiledJSON(
      "office",
      "assets/map/office.json"
    );
    this.load.tilemapTiledJSON(
      "office_2nd_floor",
      "assets/map/office_2nd_floor.json"
    );

    this.load.spritesheet(
      "bob-idle",
      "assets/sprites/bob-idle.png",
      {
        frameWidth: 16,
        frameHeight: 32,
      }
    );
    this.load.spritesheet(
      "male-run",
      "assets/sprites/male.png",
      {
        frameWidth: 16,
        frameHeight: 27,
      }
    );
    this.load.spritesheet(
      "npc-ada-idle",
      "assets/sprites/ada-idle.png",
      {
        frameWidth: 16,
        frameHeight: 32,
      }
    );
    this.load.spritesheet(
      "npc-ada-run",
      "assets/sprites/ada-run.png",
      {
        frameWidth: 16,
        frameHeight: 32,
      }
    );
    this.load.spritesheet(
      "female-run",
      "assets/sprites/female.png",
      {
        frameWidth: 18,
        frameHeight: 29,
      }
    );
    this.load.spritesheet(
      "nonbinary-run",
      "assets/sprites/nonbinary.png",
      {
        frameWidth: 18,
        frameHeight: 29,
      }
    );

    this.load.audio(
      "bgm_hub",
      "assets/sounds/music/bg_music.mp3"
    );
    this.load.audio("snd_coin", "assets/sounds/coin.wav");
    this.load.audio(
      "snd_door_open",
      "assets/sounds/door_open.wav"
    );
    this.load.audio(
      "snd_water_drop",
      "assets/sounds/water_drop.wav"
    );
    this.load.audio("snd_error", "assets/sounds/error.wav");

    try {
      this.load.spritesheet(
        "buda-idle",
        "assets/sprites/buda.png",
        { frameWidth: 500, frameHeight: 500 }
      );
    } catch (error) {}

    this.load.audio("type_1", "assets/sounds/type_1.wav");
    this.load.audio("type_2", "assets/sounds/type_2.wav");
    this.load.audio("type_3", "assets/sounds/type_3.wav");

    this.load.audio(
      "snd_select",
      "assets/sounds/select.mp3"
    );
    this.load.audio(
      "snd_confirm",
      "assets/sounds/confirm.wav"
    );
    this.load.audio(
      "intro_music",
      "assets/sounds/music/intro.wav"
    );

    this.createLoadingBar();
  }

  create() {
    // DEBUG: Verificar quais texturas foram carregadas
    console.log("=== TEXTURAS CARREGADAS ===");
    console.log(
      "male-face:",
      this.textures.exists("male-face")
        ? "✓"
        : "✗ (não existe ou erro)"
    );
    console.log(
      "female-face:",
      this.textures.exists("female-face")
        ? "✓"
        : "✗ (não existe ou erro)"
    );
    console.log(
      "nonbinary-face:",
      this.textures.exists("nonbinary-face")
        ? "✓"
        : "✗ (não existe ou erro)"
    );
    console.log(
      "frame-gold:",
      this.textures.exists("frame-gold")
        ? "✓"
        : "✗ (não existe ou erro)"
    );

    // Se frame-gold não existe, vamos criar programaticamente
    if (!this.textures.exists("frame-gold")) {
      console.log(
        "AVISO: frame-gold.png não encontrado. Criando frame programaticamente..."
      );
      this.createFallbackFrame();
    }

    this.scene.start("SplashScene");
    // Ou: this.scene.start("IntroScene");
  }

  // Método para criar frame fallback se a imagem não existir
  private createFallbackFrame() {
    const graphics = this.add.graphics();

    // Cria um frame dourado simples
    const width = 128;
    const height = 128;

    // Gradiente dourado
    graphics.fillGradientStyle(
      0xffd700,
      1, // Top-left: gold
      0xd4af37,
      1, // Top-right: metallic gold
      0xb8860b,
      1, // Bottom-left: dark goldenrod
      0x8b6514,
      1 // Bottom-right: golden brown
    );
    graphics.fillRect(0, 0, width, height);

    // Borda escura
    graphics.lineStyle(4, 0x000000, 0.8);
    graphics.strokeRect(2, 2, width - 4, height - 4);

    // Borda dourada interna
    graphics.lineStyle(3, 0xffd700, 1);
    graphics.strokeRect(0, 0, width, height);

    // Renderiza para textura
    graphics.generateTexture("frame-gold", width, height);
    graphics.destroy();

    console.log("Frame fallback criado como 'frame-gold'");
  }

  private createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(
      width / 2 - 160,
      height / 2 - 25,
      320,
      50
    );

    const loadingText = this.add
      .text(width / 2, height / 2 - 50, "Carregando...", {
        font: "20px monospace",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        width / 2 - 150,
        height / 2 - 15,
        300 * value,
        30
      );
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  }
}
