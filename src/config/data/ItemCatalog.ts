import { InventoryItem } from "../models/InventoryItem";

export const ITEM_CATALOG: Record<string, InventoryItem> = {
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
  keycard: {
    id: "keycard",
    name: "Cartão de Acesso",
    description:
      "Cartão de acesso que permite adentrar áreas restritas. Você recebeu ao iniciar sua jornada.",
    obtained: false,
    canBeUsed: true,
    canBeDropped: false,
    iconTexture: "npc-ada-run",
    iconFrame: 5,
  },
  issiPin: {
    id: "issi_pin",
    name: "Pin I.S.S.I.",
    description:
      '"Algumas bandeiras não se explicam."\nUm símbolo de estrada, verdade e irmandade.\nQuem reconhece, entende.',
    obtained: false,
    canBeDropped: false,
    canBeUsed: false,
    iconFrame: 0,
    iconTexture: "issi_pin",
  },
};
