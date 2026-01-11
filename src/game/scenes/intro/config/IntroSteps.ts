// config/IntroSteps.ts
import {
  IntroStep,
  PlayerGender,
  PlayerCareer,
} from "../types/IntroTypes";

export const INTRO_STEPS: IntroStep[] = [
  {
    id: 0,
    text: "Olá! Eu sou o Buda.\nEngenheiro Front-End e criador deste mundo.",
    type: "dialog",
  },
  {
    id: 1,
    text: "Nele, cada prédio é uma parte da minha vida, cada interação um ponto a ser conhecido...",
    type: "dialog",
  },
  {
    id: 2,
    text: "Mas... antes de começarmos nossa jornada,\ncomo você prefere ser chamado?",
    type: "name-input",
  },
  {
    id: 3,
    text: "Perfeito! E como você se identifica?",
    type: "gender-select",
  },
  {
    id: 4,
    text: "Agora, conte-nos sobre sua área de atuação.\nO que você faz profissionalmente?",
    type: "career-select",
  },
  {
    id: 5,
    text: "Excelente! Preparando seu crachá de acesso...",
    type: "idcard-show",
  },
];

// Funções auxiliares
export const getWelcomePronoun = (
  gender: PlayerGender
): string => {
  const pronouns = {
    male: "bem-vindo",
    female: "bem-vinda",
    nonbinary: "bem-vinde",
  };
  return pronouns[gender] || "bem-vindo(a)";
};

export const getCareerTitle = (
  career: PlayerCareer
): string => {
  const titles = {
    recruiter: "Recrutador(a)",
    manager: "Gerente",
    developer: "Desenvolvedor(a)",
    designer: "Designer",
    analyst: "Analista",
    entrepreneur: "Empreendedor(a)",
  };
  return titles[career] || "Profissional";
};

export const getCareerDescription = (
  career: PlayerCareer
): string => {
  const descriptions = {
    recruiter: "Encontra e desenvolve talentos",
    manager: "Lidera equipes e projetos",
    developer: "Cria soluções com código",
    designer: "Dá vida a ideias visuais",
    analyst: "Transforma dados em insights",
    entrepreneur: "Cria novas oportunidades",
  };
  return descriptions[career] || "Faz coisas incríveis";
};

export const getCareerIcon = (
  career: PlayerCareer
): string => {
  const icons = {
    recruiter: "👔",
    manager: "📊",
    developer: "💻",
    designer: "🎨",
    analyst: "📈",
    entrepreneur: "🚀",
  };
  return icons[career] || "👤";
};

export const getCareerColor = (
  career: PlayerCareer
): number => {
  const colors = {
    recruiter: 0x3498db, // Azul
    manager: 0xe74c3c, // Vermelho
    developer: 0x2ecc71, // Verde
    designer: 0x9b59b6, // Roxo
    analyst: 0xf39c12, // Laranja
    entrepreneur: 0x1abc9c, // Turquesa
  };
  return colors[career] || 0x95a5a6;
};

export const getFinalWelcomeMessage = (
  name: string,
  gender: PlayerGender,
  career: PlayerCareer
): string => {
  const pronoun = getWelcomePronoun(gender);
  const careerTitle = getCareerTitle(career);

  return `Seja ${pronoun}, ${name}!\nComo ${careerTitle}, você vai apreciar os detalhes deste portfólio.\nSeu crachá está pronto. Explore e descubra minha jornada!`;
};

// Exporta também os arrays para uso nos componentes
export const CAREER_OPTIONS: PlayerCareer[] = [
  "recruiter",
  "manager",
  "developer",
  "designer",
  "analyst",
  "entrepreneur",
];

// Textos completos para cada passo (se necessário para referência)
export const STEP_TEXTS = {
  WELCOME:
    "Olá! Eu sou o Buda.\nEngenheiro Front-End e criador deste mundo.",
  BUILDING:
    "Nele, cada prédio é uma parte da minha vida, cada interação um ponto a ser conhecido...",
  NAME_QUESTION:
    "Mas... antes de começarmos nossa jornada,\ncomo você prefere ser chamado?",
  GENDER_QUESTION: "Perfeito! E como você se identifica?",
  CAREER_QUESTION:
    "Agora, conte-nos sobre sua área de atuação.\nO que você faz profissionalmente?",
  FINAL_PREPARATION:
    "Excelente! Preparando seu crachá de acesso...",
};
