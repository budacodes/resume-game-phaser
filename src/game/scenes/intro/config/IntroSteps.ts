import { IntroStep } from "../types/IntroTypes";

export const INTRO_STEPS: IntroStep[] = [
  {
    id: 0,
    text: "Saudações! Eu sou o Buda.\nArquiteto deste mundo virtual.",
    type: "dialog",
  },
  {
    id: 1,
    text: "O que você verá adiante não é apenas código... são fragmentos da minha vida representados através dessa realidade cibernética.",
    type: "dialog",
  },
  {
    id: 2,
    text: "Para o sistema te reconhecer, você precisará de uma credencial... irei criar para você. \nComo você gostaria de assinar sua presença aqui?",
    type: "name-input",
  },
  {
    id: 3,
    text: "Certo! E como sua essência se manifesta?",
    type: "gender-select",
  },
  {
    id: 4,
    text: "O sistema requer uma especialização para o acesso.\nQual é a sua diretriz profissional?",
    type: "career-select",
  },
  {
    id: 5,
    text: "Conexão estabelecida! Gerando sua chave de acesso neural... Não se mova.",
    type: "idcard-show",
  },
];
