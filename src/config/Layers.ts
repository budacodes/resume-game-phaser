// src/config/Layers.ts

// 1. Definição dos Níveis de Profundidade (Z-Index)
// Usamos intervalos de 10 em 10 para ter espaço caso precise encaixar algo no meio depois.
export const DEPTH = {
  GROUND: 0, // Chão, Terra, Grama
  LOW_OBJ: 5, // Tapetes, Manchas, Sombras
  WALLS: 10, // Paredes, Cercas, Troncos (Atrás do Player)
  MID_OBJ: 15,

  PLAYER: 20, // *** O PLAYER FICA AQUI ***

  HIGH_OBJ: 30, // Mesas altas, Topo de postes, Copas de árvore (Frente do Player)
  ROOF: 40, // Telhados, Placas flutuantes
  OVERLAY: 100, // Chuva, Nuvens, UI do mundo
};

// 2. Mapeamento: Nome no Tiled -> Regras
// collides: true (ativa colisão), false (apenas visual)
export const LAYER_CONFIG: Record<
  string,
  { depth: number; collides: boolean }
> = {
  // --- LAYERS DO HUB ---
  Ground: { depth: DEPTH.GROUND, collides: false },
  Chairs: { depth: DEPTH.LOW_OBJ, collides: false }, // Cadeira baixa o player passa por cima
  Decoration: { depth: DEPTH.LOW_OBJ, collides: false },

  Buildings_Base: { depth: DEPTH.WALLS, collides: true }, // Paredes colidem
  Buildings_Top: { depth: DEPTH.ROOF, collides: false }, // Paredes colidem
  Fountain_Back: { depth: DEPTH.HIGH_OBJ, collides: true },
  Trees_Back: { depth: DEPTH.HIGH_OBJ, collides: false },

  Fountain_Front: { depth: DEPTH.HIGH_OBJ, collides: false }, // Colide mas desenha na frente
  Trees_Front: { depth: DEPTH.MID_OBJ, collides: true }, // Copa da árvore não colide, só tapa
  Windows: { depth: DEPTH.WALLS, collides: false },
  Windows_Top: { depth: DEPTH.ROOF, collides: false },
  Street_Lights: { depth: DEPTH.WALLS, collides: true },

  // --- LAYERS DE INTERIORES (Novas) ---
  Floor: { depth: DEPTH.GROUND, collides: false },
  Rugs: { depth: DEPTH.LOW_OBJ, collides: false },
  Walls: { depth: DEPTH.WALLS, collides: true },
  Furniture: { depth: DEPTH.WALLS, collides: true }, // Estantes, mesas
  Furniture_Top: { depth: DEPTH.HIGH_OBJ, collides: false }, // Parte de cima da estante
  Decorations: { depth: DEPTH.MID_OBJ, collides: true },
};
