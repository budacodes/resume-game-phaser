import { Scene } from "phaser";
import { CursorManager } from "../../../../systems/CursorManager";

export type CareerOption = {
  id: string;
  title: string;
  description: string;
  frame: number;
  color: number;
};

export class CareerOptions {
  private scene: Scene;
  private optionsContainer!: Phaser.GameObjects.Container;
  private careers: CareerOption[];
  private selectedCareer: string | null = null;
  private onSelect: (careerId: string) => void;
  private onHover?: (careerId: string) => void;
  private currentHighlightedIndex: number = 0;
  private careerIcons!: Phaser.GameObjects.Sprite;
  private cursorManager!: CursorManager;

  // Cores no estilo retro
  private readonly COLORS = {
    highlight: 0x00ff00, // Verde neón
    text: 0xffffff,
    bg: 0x000000,
    border: 0x444444,
    title: 0x00ff00, // Verde para o título
  };

  private readonly SIZE = {
    width: 200,
    height: 90,
  };

  constructor(
    scene: Scene,
    onSelect: (careerId: string) => void,
    onHover?: (careerId: string) => void
  ) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.onHover = onHover;

    this.careers = this.getCareerOptions();

    this.cursorManager = CursorManager.getInstance();
  }

  getCareerOptions(): CareerOption[] {
    return [
      {
        id: "recruiter",
        title: "RECRUTADOR",
        description: "Encontra talentos e constrói equipes",
        frame: 0,
        color: 0x3498db, // Azul
      },
      {
        id: "manager",
        title: "GERENTE",
        description: "Lidera projetos e times",
        frame: 1,
        color: 0xe74c3c, // Vermelho
      },
      {
        id: "developer",
        title: "DESENVOLVEDOR",
        description: "Cria sistemas e soluções",
        frame: 2,
        color: 0x2ecc71, // Verde
      },
      {
        id: "designer",
        title: "DESIGNER",
        description: "Cria experiências visuais",
        frame: 3,
        color: 0x9b59b6, // Roxo
      },
      {
        id: "analyst",
        title: "ANALISTA",
        description: "Analisa dados e processos",
        frame: 4,
        color: 0xf39c12, // Laranja
      },
      {
        id: "entrepreneur",
        title: "EMPREENDEDOR",
        description: "Cria seu próprio caminho",
        frame: 5,
        color: 0x1abc9c, // Turquesa
      },
    ];
  }

  public create(): void {
    const centerX = this.scene.scale.width / 2;
    const startY = 200;
    const spacing = 136;

    this.optionsContainer = this.scene.add
      .container(0, 0)
      .setDepth(50);

    // 1. TÍTULO PRINCIPAL
    // this.createTitle();

    // 2. Cria cada opção de cargo
    this.careers.forEach((career, index) => {
      const x = centerX + ((index % 3) - 1) * 220;
      const y = startY + Math.floor(index / 3) * spacing;

      const careerOption = this.createCareerOption(
        career,
        x,
        y
      );
      this.optionsContainer.add(careerOption);
    });

    // Destacar a primeira opção inicialmente
    this.highlightOptionByIndex(0);

    // Configura navegação por teclado
    this.setupKeyboardNavigation();
  }

  // private createTitle(): void {
  //   const centerX = this.scene.scale.width / 2;

  //   this.titleText = this.scene.add
  //     .text(
  //       centerX,
  //       36, // Posição Y do título
  //       "QUAL É SUA ÁREA DE ATUAÇÃO?",
  //       {
  //         fontSize: "32px",
  //         fontFamily: "VT323",
  //         color: this.colorToString(this.COLORS.title),
  //         backgroundColor: "rgba(0, 0, 0, 0.7)",
  //         padding: { x: 20, y: 10 },
  //         align: "center",
  //       }
  //     )
  //     .setOrigin(0.5)
  //     .setDepth(51); // Um pouco acima do container

  //   this.optionsContainer.add(this.titleText);
  // }

  private createCareerOption(
    career: CareerOption,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add
      .container(x, y)
      .setDepth(50);

    // Fundo
    const bg = this.scene.add.graphics();
    bg.fillStyle(this.COLORS.bg, 0.9);
    bg.fillRoundedRect(
      -this.SIZE.width / 2,
      -this.SIZE.height / 2,
      this.SIZE.width,
      this.SIZE.height,
      10
    );

    // Borda
    bg.lineStyle(2, this.COLORS.border, 1);
    bg.strokeRoundedRect(
      -this.SIZE.width / 2,
      -this.SIZE.height / 2,
      this.SIZE.width,
      this.SIZE.height,
      10
    );

    // Ícone
    const icon = this.scene.add.sprite(
      0,
      -50,
      "career_icons",
      career.frame
    );
    icon.setScale(0.25).setOrigin(0.5);

    // Título do cargo
    const title = this.scene.add.text(
      -this.SIZE.width / 2 + 60,
      -25, // Subimos de -15 para -25
      career.title,
      {
        fontSize: "18px",
        fontFamily: "VT323",
        color: this.colorToString(career.color),
        fontStyle: "bold",
      }
    );

    // Descrição
    const desc = this.scene.add.text(
      -this.SIZE.width / 2 + 60,
      2, // Subimos de 10 para 2
      career.description,
      {
        fontSize: "14px",
        fontFamily: "VT323",
        color: this.colorToString(this.COLORS.text),
        wordWrap: { width: 125 }, // Aumentei levemente a largura da quebra
        lineSpacing: -2, // Aperta um pouco as linhas se necessário
      }
    );

    container.add([bg, icon, title, desc]);

    // Área interativa
    const hitArea = new Phaser.Geom.Rectangle(
      -this.SIZE.width / 2,
      -this.SIZE.height / 2,
      this.SIZE.width,
      this.SIZE.height
    );
    container.setInteractive(
      hitArea,
      Phaser.Geom.Rectangle.Contains
    );

    // Eventos de hover
    container.on("pointerover", () => {
      const index = this.careers.findIndex(
        (c) => c.id === career.id
      );
      if (index !== -1) {
        this.removeHighlightFromIndex(
          this.currentHighlightedIndex
        );
        this.currentHighlightedIndex = index;
        this.highlightOptionByIndex(index);
      }
      this.onCareerHover(career.id);
    });

    container.on("pointerout", () => {
      this.cursorManager.setState("default");

      // Não remove destaque se for o item atualmente selecionado por teclado
      if (this.selectedCareer !== career.id) {
        // Apenas remove o destaque se não for o item atualmente destacado por teclado
        const index = this.careers.findIndex(
          (c) => c.id === career.id
        );
        if (index !== this.currentHighlightedIndex) {
          this.highlightOption(
            container,
            career.color,
            false
          );
        }
      }
    });

    container.on("pointerdown", () => {
      this.selectCareer(career.id);
    });

    return container;
  }

  private highlightOption(
    container: Phaser.GameObjects.Container,
    color: number,
    highlight: boolean
  ): void {
    // Encontra o fundo (primeiro elemento)
    const bg = container.list[0];

    // Verifica se é um objeto Graphics
    if (!(bg instanceof Phaser.GameObjects.Graphics)) {
      console.warn(
        "Primeiro elemento do container não é Graphics"
      );
      return;
    }

    // Limpa o gráfico
    bg.clear();

    if (highlight) {
      // Fundo com brilho
      bg.fillStyle(0x000000, 0.95);
      bg.fillRoundedRect(
        -this.SIZE.width / 2,
        -this.SIZE.height / 2,
        this.SIZE.width,
        this.SIZE.height,
        10
      );

      // Borda neon
      bg.lineStyle(3, color, 1);
      bg.strokeRoundedRect(
        -this.SIZE.width / 2,
        -this.SIZE.height / 2,
        this.SIZE.width,
        this.SIZE.height,
        10
      );

      // Brilho interno
      bg.lineStyle(1, 0xffffff, 0.5);
      bg.strokeRoundedRect(
        -this.SIZE.width / 2 + 2,
        -this.SIZE.height / 2 + 2,
        this.SIZE.width - 4,
        this.SIZE.height - 4,
        8
      );
    } else {
      // Normal
      bg.fillStyle(this.COLORS.bg, 0.9);
      bg.fillRoundedRect(
        -this.SIZE.width / 2,
        -this.SIZE.height / 2,
        this.SIZE.width,
        this.SIZE.height,
        10
      );

      bg.lineStyle(2, this.COLORS.border, 1);
      bg.strokeRoundedRect(
        -this.SIZE.width / 2,
        -this.SIZE.height / 2,
        this.SIZE.width,
        this.SIZE.height,
        10
      );
    }
  }

  private highlightOptionByIndex(index: number): void {
    // Encontrar o container correspondente ao índice
    // Os containers começam no índice 1 porque o índice 0 é o título
    const containerIndex = index;

    if (
      containerIndex < this.optionsContainer.list.length
    ) {
      const container =
        this.optionsContainer.list[containerIndex];
      if (
        container instanceof Phaser.GameObjects.Container
      ) {
        const career = this.careers[index];
        this.highlightOption(container, career.color, true);
      }
    }
  }

  private removeHighlightFromIndex(index: number): void {
    const containerIndex = index;

    if (
      containerIndex < this.optionsContainer.list.length
    ) {
      const container =
        this.optionsContainer.list[containerIndex];
      if (
        container instanceof Phaser.GameObjects.Container
      ) {
        const career = this.careers[index];
        this.highlightOption(
          container,
          career.color,
          false
        );
      }
    }
  }

  private onCareerHover(careerId: string): void {
    if (this.onHover) {
      this.onHover(careerId);
    }

    // Efeito sonoro de hover
    // this.scene.sound.play("ui-hover", { volume: 0.3 });
  }

  private selectCareer(careerId: string): void {
    if (this.selectedCareer !== null) return; // Evitar múltiplas seleções

    this.selectedCareer = careerId;

    // Efeito sonoro
    // this.scene.sound.play("ui-select", { volume: 0.5);

    // Efeito visual em todos os itens
    this.careers.forEach((career, index) => {
      const containerIndex = index;

      if (
        containerIndex < this.optionsContainer.list.length
      ) {
        const container =
          this.optionsContainer.list[containerIndex];
        if (
          container instanceof Phaser.GameObjects.Container
        ) {
          const isSelected = career.id === careerId;
          this.highlightOption(
            container,
            career.color,
            isSelected
          );
        }
      }
    });

    // Chama callback
    this.onSelect(careerId);

    // Efeito de confirmação
    this.playConfirmationEffect();

    // Desabilitar interações após seleção
    this.disableInteractions();
  }

  private playConfirmationEffect(): void {
    const selectedCareer = this.careers.find(
      (c) => c.id === this.selectedCareer
    );
    if (!selectedCareer) return;

    // Partículas coloridas
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.graphics({
        x: this.scene.scale.width / 2,
        y: this.scene.scale.height / 2,
      });

      particle.fillStyle(selectedCareer.color, 1);
      particle.fillCircle(0, 0, Phaser.Math.Between(2, 5));

      const angle = Phaser.Math.Between(0, 360);
      const distance = Phaser.Math.Between(50, 150);

      this.scene.tweens.add({
        targets: particle,
        x:
          particle.x +
          Math.cos(Phaser.Math.DegToRad(angle)) * distance,
        y:
          particle.y +
          Math.sin(Phaser.Math.DegToRad(angle)) * distance,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private setupKeyboardNavigation(): void {
    let selectedIndex = 0;
    const totalOptions = this.careers.length;

    // Remove todos os listeners anteriores
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      keyboard.removeAllListeners();
    }

    const moveSelection = (dx: number, dy: number) => {
      const cols = 3; // 3 colunas

      // Remover destaque da opção atual
      this.removeHighlightFromIndex(selectedIndex);

      // Calcular nova posição
      if (dy !== 0) {
        selectedIndex += dy * cols;
      } else {
        selectedIndex += dx;
      }

      // Wrap around
      if (selectedIndex < 0)
        selectedIndex = totalOptions - 1;
      if (selectedIndex >= totalOptions) selectedIndex = 0;

      // Destacar nova opção
      this.highlightOptionByIndex(selectedIndex);
      this.currentHighlightedIndex = selectedIndex;

      // Apenas chamar hover (não select!)
      if (this.onHover) {
        this.onHover(this.careers[selectedIndex].id);
      }
    };

    const confirmSelection = () => {
      if (this.selectedCareer === null) {
        this.selectCareer(this.careers[selectedIndex].id);
      }
    };

    // Configura listeners
    if (keyboard) {
      keyboard.on("keydown-LEFT", () =>
        moveSelection(-1, 0)
      );
      keyboard.on("keydown-RIGHT", () =>
        moveSelection(1, 0)
      );
      keyboard.on("keydown-UP", () => moveSelection(0, -1));
      keyboard.on("keydown-DOWN", () =>
        moveSelection(0, 1)
      );
      keyboard.on(
        "keydown-ENTER",
        (event: KeyboardEvent) => {
          event.preventDefault();
          event.stopPropagation();
          confirmSelection();
        }
      );
      keyboard.on(
        "keydown-SPACE",
        (event: KeyboardEvent) => {
          event.preventDefault();
          event.stopPropagation();
          confirmSelection();
        }
      );
    }
  }

  private disableInteractions(): void {
    // Remove interatividade dos containers
    this.optionsContainer.list.forEach((item, index) => {
      // Pula o título (índice 0) e instrução (último)
      if (
        index > 0 &&
        index < this.optionsContainer.list.length - 1
      ) {
        if (item instanceof Phaser.GameObjects.Container) {
          item.removeInteractive();
        }
      }
    });

    // Remove listeners do teclado
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      keyboard.removeAllListeners();
    }
  }

  public getSelectedCareer(): string | null {
    return this.selectedCareer;
  }

  public getCareerTitle(careerId: string): string {
    return (
      this.careers.find((c) => c.id === careerId)?.title ||
      careerId
    );
  }

  public destroy(): void {
    this.disableInteractions();
    if (this.optionsContainer) {
      this.optionsContainer.destroy();
    }
  }

  private colorToString(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }
}
