import { Scene } from "phaser";
import { AudioSystem } from "./AudioSystem";

export class TextTyper {
  private scene: Scene;
  private audio: AudioSystem;
  private isTyping = false;

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
    this.isTyping = true;
    textObject.setText("");

    let charIndex = 0;
    let lastSoundTime = 0;
    const soundCooldown = 40;

    const timer = this.scene.time.addEvent({
      delay: speed,
      callback: () => {
        textObject.setText(message.substring(0, charIndex));
        charIndex++;

        const now = this.scene.time.now;
        if (now - lastSoundTime > soundCooldown) {
          this.audio.playTypeSound();
          lastSoundTime = now;
        }

        if (charIndex > message.length) {
          timer.remove();
          this.isTyping = false;
          onComplete();
        }
      },
      callbackScope: this,
      repeat: message.length,
    });
  }

  get typing(): boolean {
    return this.isTyping;
  }
}
