import { Scene } from "phaser";
import VirtualJoystick from "phaser3-rex-plugins/plugins/virtualjoystick.js";
import { DialogBox } from "../ui/DialogBox";

export class UIScene extends Scene {
  private joystick!: VirtualJoystick;
  private dialogBox!: DialogBox;
  private bgm!: Phaser.Sound.BaseSound;
  public joystickCursorKeys: any;
  private muteButton!: Phaser.GameObjects.Sprite;

  constructor() {
    super({ key: "UIScene" });
  }

  // ... preload igual ...

  create() {
    // 1. Configuração da DialogBox e Joystick (MANTÉM IGUAL SEU CÓDIGO)
    this.dialogBox = new DialogBox(this);
    const x = this.scale.width / 2 - 110;
    const y = this.scale.height - 120;
    this.dialogBox.setPosition(x, y);

    this.joystick = new VirtualJoystick(this, {
      x: 100,
      y: this.scale.height - 100,
      radius: 50,
      base: this.add
        .circle(0, 0, 50, 0x888888)
        .setAlpha(0.5),
      thumb: this.add
        .circle(0, 0, 25, 0xcccccc)
        .setAlpha(0.8),
      dir: "8dir",
      forceMin: 16,
      enable: true,
    });
    this.joystickCursorKeys =
      this.joystick.createCursorKeys();

    // 2. CONFIGURAÇÃO DOS EVENTOS (AQUI ESTAVA O ERRO)

    // Em vez de tentar caçar a MainScene, ouvimos o Jogo inteiro.
    // É como um rádio: MainScene transmite na frequência "show-dialog", a gente sintoniza.

    this.createMuteButton();

    this.game.events.off("show-dialog");
    this.game.events.off("hide-dialog");

    this.game.events.on(
      "show-dialog",
      (
        message: string,
        height?: number,
        width?: number
      ) => {
        console.log("dentro do events.on");
        this.dialogBox.show(message, width, height);
      }
    );

    this.game.events.on("hide-dialog", () => {
      this.dialogBox.hide();
    });

    // 3. LIMPEZA DE EVENTOS (BOA PRÁTICA SENIOR)
    // Se a UIScene for destruída (game over, troca de fase),
    // precisamos parar de ouvir para não duplicar eventos depois.
    this.events.on("shutdown", () => {
      this.game.events.off("show-dialog");
      this.game.events.off("hide-dialog");
    }); // === NOVA LÓGICA DE MÚSICA ===
    this.manageMusic();
  }

  private createMuteButton() {
    // Posição: Canto superior direito (margem de 20px)
    const x = this.scale.width - 40;
    const y = 40;

    // 1. Cria o botão (Se não tiver imagem, use Text)
    // Se tiver imagem:
    this.muteButton = this.add
      .sprite(x, y, "icon_sound_on")
      .setScale(2)
      .setInteractive();

    // 2. Adiciona o evento de clique
    this.muteButton.on("pointerdown", () => {
      this.toggleMute();
    });
  }

  private toggleMute() {
    // Inverte o estado global de som do Phaser
    this.sound.mute = !this.sound.mute;

    // Lógica para Imagem
    const texture = this.sound.mute
      ? "icon_sound_off"
      : "icon_sound_on";
    this.muteButton.setTexture(texture);
  }

  private manageMusic() {
    // 1. Verifica/Cria a música
    if (!this.bgm) {
      if (this.sound.get("bgm_hub")) {
        this.bgm = this.sound.get("bgm_hub");
      } else {
        this.bgm = this.sound.add("bgm_hub", {
          volume: 0.05,
          loop: true,
        });
      }
    }

    // 2. Tenta tocar imediatamente
    if (!this.bgm.isPlaying && !this.sound.locked) {
      this.bgm.play();
    }

    const soundManager = this
      .sound as Phaser.Sound.WebAudioSoundManager;

    // 3. Lógica de Desbloqueio
    if (
      (soundManager.context &&
        soundManager.context.state === "suspended") ||
      this.sound.locked
    ) {
      const unlockAudio = () => {
        // Verifica se o context existe antes de tentar dar resume
        if (soundManager.context) {
          soundManager.context.resume().then(() => {
            if (!this.bgm.isPlaying) this.bgm.play();
          });
        } else {
          this.sound.unlock();
          if (!this.bgm.isPlaying) this.bgm.play();
        }

        // --- LIMPEZA ---
        // Remove listeners da Janela
        // Importante: Passar as mesmas opções (capture: true) para remover corretamente
        window.removeEventListener("keydown", unlockAudio, {
          capture: true,
        });
        window.removeEventListener(
          "pointerdown",
          unlockAudio,
          { capture: true }
        );
        window.removeEventListener(
          "touchstart",
          unlockAudio,
          { capture: true }
        );

        // Remove listeners do Phaser
        this.input.off("pointerdown", unlockAudio);
        if (this.input.keyboard) {
          this.input.keyboard.off("keydown", unlockAudio);
        }
      };

      // --- O SEGREDINHO DAS SETAS ---
      // Adiciona { capture: true } nas opções do EventListener.
      // Isso pega o evento no topo da janela ANTES do Phaser dar preventDefault() nas setas.
      const eventOptions = { capture: true, once: true };

      window.addEventListener(
        "keydown",
        unlockAudio,
        eventOptions
      );
      window.addEventListener(
        "pointerdown",
        unlockAudio,
        eventOptions
      );
      window.addEventListener(
        "touchstart",
        unlockAudio,
        eventOptions
      );

      // Redundância: Ouvinte interno do Phaser (caso o DOM falhe)
      this.input.once("pointerdown", unlockAudio);
      if (this.input.keyboard) {
        this.input.keyboard.once("keydown", unlockAudio);
      }
    }
  }
}
