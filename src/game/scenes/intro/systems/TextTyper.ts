// scenes/intro/systems/TextTyper.ts
import { Scene } from "phaser";
import { AudioSystem } from "./AudioSystem";

export class TextTyper {
  private scene: Scene;
  private audio: AudioSystem;
  private isTyping = false;
  private isPaused = false;
  private currentTimer: Phaser.Time.TimerEvent | null =
    null;
  private currentTextObject: Phaser.GameObjects.Text | null =
    null;
  private currentFullMessage: string = "";
  private currentCallback: (() => void) | null = null;

  constructor(scene: Scene, audio: AudioSystem) {
    this.scene = scene;
    this.audio = audio;
  }

  typeText(
    textObject: Phaser.GameObjects.Text,
    message: string,
    onComplete: () => void,
    speed: number = 30
  ): void {
    this.stop(); // Interrompe qualquer digitação anterior imediatamente

    this.isTyping = true;
    this.currentTextObject = textObject;
    this.currentFullMessage = message;
    this.currentCallback = onComplete;

    textObject.setText(""); // Limpa o objeto de texto do Phaser

    let charIndex = 0;
    const speechSounds = [
      "speech_1",
      "speech_2",
      "speech_3",
      "speech_4",
    ];

    this.currentTimer = this.scene.time.addEvent({
      delay: speed,
      callback: () => {
        if (this.isPaused || !this.isTyping) return;

        charIndex++;
        // Define o texto de forma absoluta (substring) em vez de concatenar (+=)
        textObject.setText(message.substring(0, charIndex));

        if (
          charIndex % 3 === 0 &&
          message[charIndex - 1] !== " "
        ) {
          const randomSound =
            Phaser.Utils.Array.GetRandom(speechSounds);
          this.scene.sound.play(randomSound, {
            volume: 0.5,
          });
        }

        if (charIndex >= message.length) {
          this.completeTyping();
        }
      },
      callbackScope: this,
      loop: true,
    });
  }

  skipTyping(): void {
    if (!this.isTyping || !this.currentTextObject) return;

    const fullMsg = this.currentFullMessage;
    const cb = this.currentCallback;

    this.stop(); // Mata o timer e limpa estados

    this.currentTextObject.setText(fullMsg);
    if (cb) cb();
  }

  private completeTyping(): void {
    const cb = this.currentCallback;
    this.stop();
    if (cb) cb();
  }

  stop(): void {
    if (this.currentTimer) {
      this.currentTimer.destroy();
      this.currentTimer = null;
    }
    this.isTyping = false;
    this.isPaused = false;
    this.currentCallback = null;
    this.audio.stopTypeSound();
  }

  pause(): void {
    this.isPaused = true;
  }
  resume(): void {
    this.isPaused = false;
  }
  get typing(): boolean {
    return this.isTyping;
  }
  get paused(): boolean {
    return this.isPaused;
  }
}
