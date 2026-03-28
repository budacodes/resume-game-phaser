export type GuidePage = {
  id: string;
  title: string;
  content: string;
};

export const SURVIVAL_GUIDE_PAGES: GuidePage[] = [
  {
    id: "intro",
    title: "Introdução",
    content:
      "O mundo não vem com instruções claras.\n\nMas algumas regras podem ser observadas.\nPreste atenção no ambiente.",
  },
  {
    id: "movement",
    title: "Movimento",
    content:
      "Use as teclas direcionais para se mover.\n\nNem todo caminho é visível à primeira vista.",
  },
  {
    id: "interaction",
    title: "Interação",
    content:
      "Alguns objetos respondem à sua presença.\n\nAproxime-se e pressione [E].",
  },
  {
    id: "inventory",
    title: "Inventário",
    content:
      "Você carrega mais do que percebe.\n\nPressione [I] para acessar o inventário.",
  },
  {
    id: "observation",
    title: "Observação",
    content:
      "Nem tudo é explicado.\n\nMas tudo deixa pistas.",
  },
];
