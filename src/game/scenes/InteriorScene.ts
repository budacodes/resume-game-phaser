import { Scene } from "phaser";
import { Player } from "../../entities/Player";
import { MapManager } from "../../managers/MapManager";
import { UIScene } from "./ui/UiScene";

export class InteriorScene extends Scene {
  // --- SISTEMAS ---
  private player!: Player;
  private mapManager!: MapManager;
  private uiScene!: UIScene;
  private doorOpenSound!: Phaser.Sound.BaseSound;
  private errorSound!: Phaser.Sound.BaseSound;

  // --- DADOS DE INICIALIZAÇÃO ---
  private mapKey!: string;
  private spawnName!: string;
  private initialFacing!: "up" | "down" | "right" | "left";

  // --- CONTROLES ---
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyY!: Phaser.Input.Keyboard.Key;
  private keyN!: Phaser.Input.Keyboard.Key;
  private isInteractionCooldown: boolean = false;

  // --- INTERAÇÃO ---
  private itemsZone!: Phaser.Physics.Arcade.StaticGroup;
  private currentInteractiveObject: Phaser.GameObjects.Zone | null =
    null;
  private interactionPrompt!: Phaser.GameObjects.Sprite;

  // --- ESTADOS ---
  private isReading: boolean = false;

  private npcs!: Phaser.Physics.Arcade.Group; // Grupo para gerenciar todos NPCs
  private hasAppointment: boolean = false;

  constructor() {
    super("InteriorScene");
  }

  /**
   * Recebe dados da cena anterior (MainScene)
   */
  init(data: {
    mapKey: string;
    spawnName: string;
    facingDirection?: "up" | "down" | "right" | "left";
  }) {
    this.mapKey = data.mapKey || "office"; // Fallback se esquecer de passar
    this.spawnName = data.spawnName || "spawn_entrance";
    this.initialFacing = data.facingDirection || "up"; // Padrão: Entrando na sala (olhando pra cima)
  }

  create() {
    // 1. FUNDO PRETO (Importante para interiores pequenos)
    this.cameras.main.setBackgroundColor("#111111");

    this.game.events.emit("scene-changed", "InteriorScene");

    // Ou ativa o joystick diretamente
    this.game.events.emit("enable-joystick");

    // 2. RECUPERA A UI (Sem reiniciar a cena, pois ela é persistente)
    if (this.scene.isActive("UIScene")) {
      this.uiScene = this.scene.get("UIScene") as UIScene;
      this.scene.bringToTop("UIScene"); // <--- OBRIGATÓRIO: Traz o Joystick pra frente
    } else {
      this.scene.launch("UIScene");
      this.uiScene = this.scene.get("UIScene") as UIScene;
      this.scene.bringToTop("UIScene"); // <--- OBRIGATÓRIO
    }

    // Garante que o estado de leitura/travamento comece limpo
    this.isReading = false;

    // 3. INICIALIZA MAPA
    this.mapManager = new MapManager(this);
    this.mapManager.init(this.mapKey); // Carrega o JSON específico passado no init

    // 4. INICIALIZA PLAYER
    // Busca o ponto de spawn dentro do JSON da sala
    const spawn = this.mapManager.getSpawnPoint(
      this.spawnName
    ) || { x: 100, y: 100 };

    this.player = new Player(this, spawn.x, spawn.y);
    this.player.setUIScene(this.uiScene);
    this.player.setFacing(this.initialFacing); // Vira o boneco para a direção certa

    this.createNPCs();

    if (this.npcs) {
      this.physics.add.collider(this.player, this.npcs);
    }

    // Colisões (Paredes vs Player)
    if (this.mapManager.colliders.length > 0) {
      this.physics.add.collider(
        this.player,
        this.mapManager.colliders
      );
    }

    // =========================================================
    // 5. CÂMERA (CORRIGIDO PARA CENTRALIZAR COM ZOOM 2X)
    // =========================================================
    const map = this.mapManager.map;
    const mapWidth = map.widthInPixels;
    const mapHeight = map.heightInPixels;

    // Configura o ZOOM fixo que você pediu
    const zoom = 2;
    this.cameras.main.setZoom(zoom);

    // Verifica se o mapa (com zoom) é menor que a tela
    const mapDisplayWidth = mapWidth * zoom;
    const mapDisplayHeight = mapHeight * zoom;
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    // Lógica Híbrida:
    if (
      mapDisplayWidth < screenWidth &&
      mapDisplayHeight < screenHeight
    ) {
      // CASO 1: O mapa cabe inteiro na tela
      // Removemos os limites (Bounds) para permitir que a câmera mostre o "preto" em volta
      // Se deixarmos setBounds aqui, ele vai travar no canto (0,0)
      this.cameras.main.removeBounds();

      // Centraliza a câmera no meio exato do mapa
      this.cameras.main.centerOn(
        mapWidth / 2,
        mapHeight / 2
      );
    } else {
      // CASO 2: O mapa é maior que a tela (scrolling)
      // Travamos a câmera para não mostrar o fundo preto
      this.cameras.main.setBounds(
        0,
        0,
        mapWidth,
        mapHeight
      );

      // Segue o player
      this.cameras.main.startFollow(
        this.player,
        true,
        0.09,
        0.09
      );
    }

    // Fade In suave ao entrar na sala
    this.cameras.main.fadeIn(500, 0, 0, 0);
    // =========================================================

    this.initAudioAndInputs();

    this.createInteractionZones();
  }

  private initAudioAndInputs() {
    this.doorOpenSound = this.sound.add("snd_door_open", {
      volume: 1,
      seek: 3,
    });

    this.errorSound = this.sound.add("snd_error", {
      volume: 1,
      seek: 0,
    });

    if (this.input.keyboard) {
      this.keyE = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );
      this.keyY = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.Y
      );
      this.keyN = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.N
      );
    }

    // Prompt visual 'E'
    this.interactionPrompt = this.add
      .sprite(0, 0, "btn-e")
      .setDepth(100)
      .setVisible(false);
  }

  private createNPCs() {
    // 1. Cria um grupo físico estático (Immovable = Player bate e não empurra)
    this.npcs = this.physics.add.group({
      immovable: true, // Não é empurrado
      allowGravity: false, // Não cai (se tivesse gravidade)
    });

    // 2. Busca a camada de NPCs (se você criou uma separada) ou Spawns
    // Se você colocou no layer 'Spawns' ou 'Interactions', mude o nome abaixo:
    const npcLayer =
      this.mapManager.map.getObjectLayer("NPCs");

    if (!npcLayer) {
      console.warn(
        "Camada 'NPCs' não encontrada no Tiled."
      );
      return;
    }

    // 3. Procura especificamente pela Ada
    const adaObj = npcLayer.objects.find(
      (obj) => obj.name === "NPC_Ada"
    );

    if (adaObj) {
      const x = adaObj.x || 0;
      const y = adaObj.y || 0;

      // 1. Criação do Sprite
      // NOTA: Certifique-se que no preloader você carregou com frameWidth: 16, frameHeight: 32 (ou a altura correta da sua sprite)
      const ada = this.npcs.create(x, y, "npc-ada-idle");

      // 2. Configurações Visuais
      ada.setOrigin(0.5, 1); // 0.5 no X centraliza melhor o sprite no tile; 1 no Y põe a âncora no pé
      ada.setDepth(10);

      // 3. CORREÇÃO DA ANIMAÇÃO (Ficar de Frente)
      // Se a animação ainda não existe, cria ela agora
      if (!this.anims.exists("ada-idle-down")) {
        this.anims.create({
          key: "ada-idle-down",
          frames: this.anims.generateFrameNumbers(
            "npc-ada-idle",
            { start: 18, end: 23 }
          ), // Frames de baixo
          frameRate: 8,
          repeat: -1,
        });
      }

      // Dá o play para ela ficar olhando para baixo e "respirando"
      ada.play("ada-idle-down");

      // 4. CORREÇÃO DA HITBOX (Interação nos Pés)
      if (ada.body) {
        const width = 16;
        const height = 10; // Altura da caixa de colisão (só o pé)

        // Assume que o sprite tem 32px de altura.
        // O Offset Y deve ser: AlturaTotal - AlturaCaixa
        // Ex: 32 - 10 = 22.
        const offsetY = ada.height - height;

        ada.body.setSize(width, height);
        ada.body.setOffset(0, offsetY);
      }
    }
  }

  update() {
    // Se estiver lendo/saindo, congela
    if (this.isReading) {
      this.player.stopMovement();
      this.handleDialogInput();
    } else {
      this.player.update();
      this.handleInteractions();
    }
  }

  // =================================================================
  // LÓGICA DE INTERAÇÃO (Copiada e adaptada da MainScene)
  // =================================================================

  private createInteractionZones() {
    this.itemsZone = this.physics.add.staticGroup({
      classType: Phaser.GameObjects.Zone,
    });

    const layer = this.mapManager.interactionLayer;
    if (!layer) return;

    layer.objects.forEach((obj) => {
      const width = obj.width || 32;
      const height = obj.height || 32;
      const x = (obj.x || 0) + width / 2;
      const y = (obj.y || 0) + height / 2;

      const zone = this.add.zone(x, y, width, height);
      zone.setData("tiledData", obj);
      this.itemsZone.add(zone);
    });
  }

  private handleInteractions() {
    this.currentInteractiveObject = null;
    let isOverlapping = false;

    this.physics.overlap(
      this.player,
      this.itemsZone,
      (player, zone) => {
        this.currentInteractiveObject =
          zone as Phaser.GameObjects.Zone;
        isOverlapping = true;
      }
    );

    if (isOverlapping && this.currentInteractiveObject) {
      // Entrou na zona: Mostra botão e anima
      if (!this.interactionPrompt.visible) {
        this.interactionPrompt.setVisible(true);
        this.startPromptLoop();
      }

      // Posiciona o botão em cima do player com o "pulo"
      const animOffset =
        this.interactionPrompt.getData("offsetY") || 0;
      this.interactionPrompt.setPosition(
        this.player.x,
        this.player.y - 15 + animOffset // <--- APLICA O PULO
      );

      // Ação
      if (
        Phaser.Input.Keyboard.JustDown(this.keyE) &&
        !this.isReading &&
        !this.isInteractionCooldown // <--- ADICIONE ESTA LINHA AQUI
      ) {
        this.triggerAction(this.currentInteractiveObject);
      }
    } else {
      // Saiu da zona
      if (this.interactionPrompt.visible) {
        this.interactionPrompt.setVisible(false);
        this.stopPromptLoop();
      }
    }
  }

  private triggerAction(zone: Phaser.GameObjects.Zone) {
    const data = zone.getData("tiledData");
    const type = this.getTiledProperty(data, "actionType");

    switch (type) {
      case "dialog":
        this.handleDialogInteraction(data);
        break;
      case "npc_ada":
        this.handleAdaInteraction();
        break;
      case "warp":
        this.handleWarpAction(data);
        break;
      // Adicione mais casos conforme necessário
      default:
        console.warn(
          `Ação desconhecida para o tipo: ${type}`
        );
    }
  }

  private handleAdaInteraction() {
    this.isReading = true; // 1. Avisa o update que estamos lendo
    this.player.stopMovement();

    const playerName =
      this.registry.get("playerName") || "Bob";

    if (this.hasAppointment) {
      // Se já falou antes
      this.game.events.emit(
        "show-dialog",
        `Ada: O elevador é logo ali à direita, ${playerName}. O chefe está te esperando no 2º andar.`,
        100,
        250
      );
    } else {
      // Primeira vez falando
      this.hasAppointment = true; // <--- LIBERA O ACESSO AQUI

      this.game.events.emit(
        "show-dialog",
        `Ada: Ah, você deve ser o ${playerName}! Eu vi seu nome na lista.\n\nPode subir, acabei de liberar seu crachá para o 2º andar.`,
        120,
        300
      );
    }
  }

  private handleWarpAction(data: any) {
    const sceneProperties = {
      mapKey: this.getTiledProperty(data, "mapKey"),
      facingDirection: this.getTiledProperty(
        data,
        "facingDirection"
      ),
      targetScene: this.getTiledProperty(
        data,
        "targetScene"
      ),
      targetSpawn: this.getTiledProperty(
        data,
        "targetSpawn"
      ),
      requiresAccess: this.getTiledProperty(
        data,
        "requiresAccess"
      ),
    };

    if (
      sceneProperties.requiresAccess &&
      !this.hasAppointment
    ) {
      this.isReading = true;
      this.player.stopMovement();

      this.game.events.emit(
        "show-dialog",
        "Segurança (Interfone): ACESSO NEGADO.\nPor favor, identifique-se na recepção com a Ada antes de subir.",
        100,
        300
      );

      // Toca um som de erro (opcional)
      this.errorSound.play();
      return; // <--- IMPEDE O CÓDIGO DE CONTINUAR (NÃO TROCA DE CENA)
    }

    if (sceneProperties.targetScene) {
      // 1. Toca um som de porta (opcional)
      this.doorOpenSound.play();
      // 2. Efeito visual (Fade Out)
      this.cameras.main.fadeOut(1000, 0, 0, 0);

      // 3. Espera o Fade terminar para trocar de cena
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start(sceneProperties.targetScene, {
            mapKey: sceneProperties.mapKey,
            spawnName: sceneProperties.targetSpawn,
            facingDirection:
              sceneProperties.facingDirection,
          });
        }
      );
    }
  }

  private handleDialogInteraction(data: any) {
    const msg =
      this.getTiledProperty(data, "message") || "...";
    const height =
      this.getTiledProperty(data, "height") || 100;
    const width =
      this.getTiledProperty(data, "width") || 200;

    this.isReading = true;
    this.game.events.emit(
      "show-dialog",
      msg,
      +height,
      +width
    );
  }

  private handleDialogInput() {
    // Fecha diálogo com E
    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      // 1. Fecha o diálogo visualmente
      this.game.events.emit("hide-dialog");
      this.isReading = false;

      // 2. ATIVA O COOLDOWN (A Mágica acontece aqui)
      this.isInteractionCooldown = true;

      // 3. Cria um timer para liberar a interação de novo após 500ms
      this.time.delayedCall(500, () => {
        this.isInteractionCooldown = false;
      });
    }
  }

  // =================================================================
  // HELPERS VISUAIS (Animação do Botão)
  // =================================================================

  private startPromptLoop() {
    this.stopPromptLoop();
    this.tweens.add({
      targets: this.interactionPrompt,
      scaleY: 0.8,
      scaleX: 0.95,
      duration: 150,
      yoyo: true,
      repeat: -1,
      repeatDelay: 500,
      ease: "Quad.easeInOut",
      onUpdate: (
        tween,
        target: Phaser.GameObjects.Sprite
      ) => {
        const currentScale = target.scaleY;
        const calculatedOffset = (1 - currentScale) * 10;
        target.setData("offsetY", calculatedOffset);
      },
    });
  }

  private stopPromptLoop() {
    this.tweens.killTweensOf(this.interactionPrompt);
    this.interactionPrompt.setScale(1);
    this.interactionPrompt.setData("offsetY", 0);
  }

  private getTiledProperty(
    obj: any,
    propName: string
  ): any {
    if (!obj || !obj.properties) return null;
    if (Array.isArray(obj.properties)) {
      const prop = obj.properties.find(
        (p: any) => p.name === propName
      );
      return prop ? prop.value : null;
    } else {
      return obj.properties[propName];
    }
  }
}
