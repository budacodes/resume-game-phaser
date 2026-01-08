import { IntroStep } from "../types/IntroTypes";

export const INTRO_STEPS: IntroStep[] = [
  {
    id: 0,
    text: "Olá! Eu sou o Buda.\nEngenheiro Front-End e criador deste mundo.",
  },
  {
    id: 1,
    text: "Nele, cada prédio é uma parte da minha vida, cada interação um ponto a ser conhecido...",
  },
  {
    id: 2,
    text: "Antes de começarmos nossa jornada,\ncomo você prefere ser chamado?",
  },
  {
    id: 3,
    text: "Perfeito! E como você se identifica?",
  },
];

export const getWelcomePronoun = (
  gender: "male" | "female" | "nonbinary"
) => {
  switch (gender) {
    case "male":
      return "bem-vindo";
    case "female":
      return "bem-vinda";
    case "nonbinary":
      return "bem-vinde";
  }
};
