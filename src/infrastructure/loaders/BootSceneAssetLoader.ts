import Phaser from "phaser";

export class BootSceneAssetLoader {
  constructor(private readonly scene: Phaser.Scene) {}

  preloadPlugins(): void {
    this.scene.load.plugin(
      "rexvirtualjoystickplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js",
      true,
    );

    this.scene.load.plugin(
      "rexbbcodetextplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexbbcodetextplugin.min.js",
      true,
    );
  }

  preloadMusic(): void {
    this.scene.load.audio(
      "bgm_hub",
      "assets/sounds/music/bg_music.wav",
    );

    this.scene.load.audio(
      "intro_music",
      "assets/sounds/music/intro.wav",
    );
  }

  preloadImages(): void {
    this.scene.load.image(
      "male-face",
      "assets/sprites/faces/male-face.png",
    );

    this.scene.load.image(
      "female-face",
      "assets/sprites/faces/female-face.png",
    );

    this.scene.load.image(
      "nonbinary-face",
      "assets/sprites/faces/nonbinary-face.png",
    );

    this.scene.load.image(
      "frame-gold",
      "assets/ui/frame-gold.png",
    );

    this.scene.load.image("btn-e", "assets/ui/key_e.png");
    
    this.scene.load.image(
      "icon_sound_on",
      "assets/ui/icon_sound_on.png",
    );

    this.scene.load.image(
      "icon_sound_off",
      "assets/ui/icon_sound_off.png",
    );

    this.scene.load.image(
      "settings",
      "assets/ui/settings.png",
    );

    this.scene.load.image("expand", "assets/ui/expand.png");

    this.scene.load.image(
      "minimize",
      "assets/ui/minimize.png",
    );

    this.scene.load.image("close", "assets/ui/close.png");

    this.scene.load.image(
      "questlog",
      "assets/ui/questlog.png",
    );

    this.scene.load.image(
      "inventory",
      "assets/ui/inventory.png",
    );

    this.scene.load.image(
      "img_signs",
      "assets/map/signs.png",
    );

    this.scene.load.image(
      "tiles_interiors",
      "assets/map/interiors.png",
    );
    this.scene.load.image(
      "tiles_builder",
      "assets/map/room.png",
    );

    this.scene.load.image(
      "tiles_urban",
      "assets/map/urban.png",
    );
  }

  preloadSpritesheets(): void {
    this.scene.load.spritesheet(
      "male-run",
      "assets/sprites/male.png",
      {
        frameWidth: 16,
        frameHeight: 27,
      },
    );

    this.scene.load.spritesheet("keys", "assets/ui/keys.png", 
      {
        frameWidth: 16,
        frameHeight: 16,
        startFrame: 0,
        endFrame: 111,
      }
    );
    
    this.scene.load.spritesheet("special_keys", "assets/ui/special_keys.png", 
      {
        frameWidth: 32,
        frameHeight: 16,
        startFrame: 0,
        endFrame: 31,
      }
    );

    this.scene.load.spritesheet(
      "npc_ada",
      "assets/sprites/npc_ada.png",
      {
        frameWidth: 14,
        frameHeight: 26,
      },
    );

    this.scene.load.spritesheet(
      "female-run",
      "assets/sprites/female.png",
      {
        frameWidth: 18,
        frameHeight: 29,
      },
    );

    this.scene.load.spritesheet(
      "nonbinary-run",
      "assets/sprites/nonbinary.png",
      {
        frameWidth: 18,
        frameHeight: 29,
      },
    );

    this.scene.load.spritesheet(
      "buda-idle",
      "assets/sprites/buda_idle.png",
      { frameWidth: 379, frameHeight: 613 },
    );

    this.scene.load.spritesheet(
      "buda-talking",
      "assets/sprites/buda_talking.png",
      { frameWidth: 483, frameHeight: 613 },
    );

    this.scene.load.spritesheet(
      "custom-cursor",
      "assets/ui/cursor-sheet.png",
      {
        frameWidth: 34,
        frameHeight: 42,
        startFrame: 0,
        endFrame: 2,
      },
    );

    this.scene.load.spritesheet(
      "planet",
      "assets/sprites/planet.png",
      {
        frameWidth: 128,
        frameHeight: 128,
        startFrame: 0,
        endFrame: 13,
      },
    );

    this.scene.load.spritesheet(
      "buda_dog",
      "assets/sprites/buda_dog.png",
      {
        frameWidth: 768,
        frameHeight: 448,
      },
    );

    this.scene.load.spritesheet(
      "coin_flip",
      "assets/sprites/coin_flip.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      },
    );

    this.scene.load.spritesheet(
      "issi_pin",
      "assets/sprites/patch_cruz.png",
      {
        frameWidth: 16,
        frameHeight: 16,
      },
    );

    this.scene.load.spritesheet(
      "career_icons",
      "assets/sprites/career_icons.png",
      {
        frameWidth: 224,
        frameHeight: 199,
      },
    );
  }

  preloadAudios(): void {
    this.scene.load.audio(
      "snd_coin",
      "assets/sounds/coin.wav",
    );

    this.scene.load.audio(
      "snd_flag",
      "assets/sounds/snd_flag.wav",
    );
    this.scene.load.audio(
      "snd_motorcycle",
      "assets/sounds/snd_motorcycle.wav",
    );
    this.scene.load.audio(
      "snd_wind",
      "assets/sounds/snd_wind.wav",
    );

    this.scene.load.audio(
      "snd_door_open",
      "assets/sounds/door_open.wav",
    );

    this.scene.load.audio(
      "snd_water_drop",
      "assets/sounds/water_drop.wav",
    );

    this.scene.load.audio(
      "snd_error",
      "assets/sounds/error.wav",
    );

    this.scene.load.audio(
      "typing",
      "assets/sounds/typing.wav",
    );

    this.scene.load.audio(
      "delete_char",
      "assets/sounds/delete_char.wav",
    );

    this.scene.load.audio(
      "speech_1",
      "assets/sounds/speech_1.wav",
    );
    this.scene.load.audio(
      "speech_2",
      "assets/sounds/speech_2.wav",
    );
    this.scene.load.audio(
      "speech_3",
      "assets/sounds/speech_3.wav",
    );
    this.scene.load.audio(
      "speech_4",
      "assets/sounds/speech_4.wav",
    );

    this.scene.load.audio(
      "snd_select",
      "assets/sounds/select.mp3",
    );

    this.scene.load.audio(
      "snd_confirm",
      "assets/sounds/confirm.wav",
    );
  }

  preloadTilemaps(): void {
    this.scene.load.tilemapTiledJSON(
      "hub",
      "assets/map/hub.json",
    );

    this.scene.load.tilemapTiledJSON(
      "office",
      "assets/map/office.json",
    );

    this.scene.load.tilemapTiledJSON(
      "office_2nd_floor",
      "assets/map/office_2nd_floor.json",
    );
  }
}
