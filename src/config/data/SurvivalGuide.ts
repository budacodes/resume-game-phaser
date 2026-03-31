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
      "> esse mundo não vem com instruções claras\n\n> algumas regras devem ser respeitadas e padrões podem ser observados\n\t\t\t* (prestar atenção no ambiente)",
  },
  {
    id: "movement",
    title: "Movimento",
    content:
      "> as teclas direcionais permitem se mover\n\n> nem todo caminho é visível à primeira vista",
  },
  {
    id: "interaction",
    title: "Interação",
    content:
      "> alguns objetos respondem à presença\n\n> pressionar [family=Courier][ E ][/family] ao se aproximar pode gerar resultados variados\n\t\t\t* (experimentar é parte do processo)",
  },
  {
    id: "inventory",
    title: "Inventário",
    content:
      "> é possível carregar itens em uma espécie de mochila\n\n> ao pressionar [family=Courier][ I ][/family] é possível acessar o inventário",
  },
  {
    id: "observation",
    title: "Observação",
    content:
      "> por aqui nem tudo é explicado\n\n> existem diversas pistas que podem ser encontradas",
  },
];
