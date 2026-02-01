import { Scene } from "phaser";
import { BootSceneAssetLoader } from "../../infrastructure/loaders/BootSceneAssetLoader";
import { BootSceneLoadingView } from "../../presentation/ui/BootSceneLoadingView";
import { BootSceneComposition } from "../../composition/BootSceneComposition";
import { FallbackFrameFactory } from "../../presentation/ui/FallbackFrameFactory";

export class BootScene extends Scene {
  private assetLoader!: BootSceneAssetLoader;
  private loadingView!: BootSceneLoadingView;
  private composition!: BootSceneComposition;
  private fallbackFrameFactory!: FallbackFrameFactory;

  constructor() {
    super("BootScene");
  }

  preload() {
    this.assetLoader = new BootSceneAssetLoader(this);
    this.assetLoader.preloadPlugins();
    this.assetLoader.preloadAudios();
    this.assetLoader.preloadImages();
    this.assetLoader.preloadSpritesheets();
    this.assetLoader.preloadMusic();
    this.assetLoader.preloadTilemaps();

    this.loadingView = new BootSceneLoadingView(this);
    this.loadingView.attach();
  }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    this.composition = new BootSceneComposition(this);
    this.composition.launchUIScene();

    this.fallbackFrameFactory = new FallbackFrameFactory(
      this,
    );
    this.fallbackFrameFactory.ensureFrameGoldExists();

    this.scene.start("SplashScene");
    // Ou: this.scene.start("IntroScene");
  }

  // Fallback frame logic moved to FallbackFrameFactory

  // Loading UI is handled by BootSceneLoadingView
}
