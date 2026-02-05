import { IntroStep } from "../../../../config/types/IntroTypes";

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
    text: "Para o sistema te reconhecer, você precisará de uma credencial... irei criar para você. \nAlém disso, vou adicionar um bloco de notas no seu inventário com instruções caso se sinta perdido!",
    type: "dialog",
  },
  {
    id: 3,
    text: "Feito. \nComo você gostaria de assinar sua presença aqui?",
    type: "name-input",
  },
  {
    id: 4,
    text: "Certo! E como sua essência se manifesta?",
    type: "gender-select",
  },
  {
    id: 5,
    text: "O sistema requer uma especialização para o acesso.\nQual é a sua diretriz profissional?",
    type: "career-select",
  },
  {
    id: 6,
    text: "Conexão estabelecida! Gerando sua chave de acesso neural... Não se mova.",
    type: "idcard-show",
  },
];
