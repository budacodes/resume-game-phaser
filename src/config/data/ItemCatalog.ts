import { InventoryItem } from "../models/InventoryItem";

export const ITEM_CATALOG: Record<string, InventoryItem> = {
  instructionsDocument: {
    id: "survival-guide",
    name: "O.F.G.S.M.R™",
    description:
      "[size=20]O Fantástico Guia de Sobrevivência do Mundo Real™ (O.F.G.S.M.R™): um guia não oficial para navegar pelas regras invisíveis do mundo.[/size]\n[size=16]Nem tudo aqui faz sentido, mas pode te ajudar...[/size]",
    obtained: false,
    canBeUsed: true,
    canBeDropped: false,
    iconFrame: 0,
    iconTexture: "issi_pin",
  },
  keycard: {
    id: "keycard",
    name: "Cartão de Acesso",
    description:
      "Cartão de acesso que permite adentrar áreas restritas. Você recebeu ao iniciar sua jornada.",
    obtained: false,
    canBeUsed: true,
    canBeDropped: false,
    isDynamic: true,
  },
  coin: {
    id: "coin",
    name: "Moeda Antiga",
    description:
      "Uma moeda antiga com símbolos desconhecidos.\nNão parece ter valor comercial mas pode ser importante.",
    obtained: false,
    canBeDropped: true,
    canBeUsed: true,
    iconFrame: 0,
    animation: {
      texture: "coin_flip",
      animationKey: "coin-flipping",
      startFrame: 0,
      endFrame: 4,
      frameRate: 8,
      repeat: -1,
    },
  },
  issiPin: {
    id: "issi_pin",
    name: "Cruz I.S.S.I.",
    description:
      '"Algumas bandeiras não se explicam..."\nUm símbolo de estrada, lealdade e irmandade.\nSomos de verdade.',
    obtained: false,
    canBeDropped: false,
    canBeUsed: false,
    iconFrame: 0,
    iconTexture: "issi_pin",
  },
};
