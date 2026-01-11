import { Game, Types } from "phaser";
import { BootScene } from "./game/scenes/BootScene";
import { InteriorScene } from "./game/scenes/InteriorScene";
import { MainScene } from "./game/scenes/MainScene";
import { UIScene } from "./game/scenes/UiScene";
import "./style.css";
import { SplashScene } from './game/scenes/SplashScene';
import { IntroScene } from './game/scenes/intro/IntroScene';

// Configuração do Jogo
const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "app", // O Vite cria uma div com id="app"
  dom: {
    createContainer: true, // <--- ADICIONE ISSO
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0, x: 0 }, // Top-down não tem gravidade puxando pra baixo
      debug: false, // Mude para false quando for lançar o jogo
    },
  },
  pixelArt: true, // Garante que não borre
  roundPixels: true,
  scene: [
    BootScene,
    UIScene,
    SplashScene,
    IntroScene,
    MainScene,
    InteriorScene,
  ], // Lista de Cenas
  scale: {
    mode: Phaser.Scale.RESIZE, // O jogo se adapta se redimensionar a janela
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Game(config);
