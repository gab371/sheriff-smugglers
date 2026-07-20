import type { Card, DeckTheme } from "./types";

export const GOOD_TYPES = {
  LEGAL: 'LEGAL' as const,
  CONTRABAND: 'CONTRABAND' as const,
};

export const CARD_THEMES: Record<DeckTheme, { [cardId: string]: Omit<Card, "uid" | "cardId"> }> = {
  WESTERN: {
    corn: { id: "corn", name: "Maïs", type: "LEGAL", icon: "🌽", value: 2, fine: 2, deckCount: 48, kingBonus: 20, queenBonus: 10 },
    potato: { id: "potato", name: "Pommes de terre", type: "LEGAL", icon: "🥔", value: 3, fine: 2, deckCount: 36, kingBonus: 15, queenBonus: 10 },
    beans: { id: "beans", name: "Haricots", type: "LEGAL", icon: "🫘", value: 3, fine: 2, deckCount: 36, kingBonus: 15, queenBonus: 10 },
    cotton: { id: "cotton", name: "Coton", type: "LEGAL", icon: "🌾", value: 4, fine: 2, deckCount: 24, kingBonus: 10, queenBonus: 5 },
    spices: { id: "spices", name: "Épices", type: "CONTRABAND", icon: "🌶️", value: 6, fine: 4, deckCount: 22 },
    moonshine: { id: "moonshine", name: "Moonshine", type: "CONTRABAND", icon: "🥃", value: 7, fine: 4, deckCount: 21 },
    gold: { id: "gold", name: "Or", type: "CONTRABAND", icon: "🪙", value: 8, fine: 4, deckCount: 12 },
    colt: { id: "colt", name: "Colt", type: "CONTRABAND", icon: "🔫", value: 9, fine: 4, deckCount: 5 }
  },
  MEDIEVAL: {
    apple: { id: "apple", name: "Pommes", type: "LEGAL", icon: "🍎", value: 2, fine: 2, deckCount: 48, kingBonus: 20, queenBonus: 10 },
    cheese: { id: "cheese", name: "Fromage", type: "LEGAL", icon: "🧀", value: 3, fine: 2, deckCount: 36, kingBonus: 15, queenBonus: 10 },
    bread: { id: "bread", name: "Pain", type: "LEGAL", icon: "🍞", value: 3, fine: 2, deckCount: 36, kingBonus: 15, queenBonus: 10 },
    chicken: { id: "chicken", name: "Poulet", type: "LEGAL", icon: "🍗", value: 4, fine: 2, deckCount: 24, kingBonus: 10, queenBonus: 5 },
    poison: { id: "poison", name: "Poison", type: "CONTRABAND", icon: "🧪", value: 6, fine: 4, deckCount: 22 },
    mead: { id: "mead", name: "Hydromel", type: "CONTRABAND", icon: "🍷", value: 7, fine: 4, deckCount: 21 },
    silk: { id: "silk", name: "Soie", type: "CONTRABAND", icon: "👗", value: 8, fine: 4, deckCount: 12 },
    crossbow: { id: "crossbow", name: "Arbalète", type: "CONTRABAND", icon: "⚔️", value: 9, fine: 4, deckCount: 5 }
  },
  MODERN: {
    soda: { id: "soda", name: "Soda", type: "LEGAL", icon: "🥤", value: 2, fine: 2, deckCount: 48, kingBonus: 20, queenBonus: 10 },
    chocolate: { id: "chocolate", name: "Chocolat", type: "LEGAL", icon: "🍫", value: 3, fine: 2, deckCount: 36, kingBonus: 15, queenBonus: 10 },
    mug: { id: "mug", name: "Mug", type: "LEGAL", icon: "☕", value: 3, fine: 2, deckCount: 36, kingBonus: 15, queenBonus: 10 },
    figurine: { id: "figurine", name: "Figurine", type: "LEGAL", icon: "🧸", value: 4, fine: 2, deckCount: 24, kingBonus: 10, queenBonus: 5 },
    cigarettes: { id: "cigarettes", name: "Cartouche de cigarettes", type: "CONTRABAND", icon: "🚬", value: 6, fine: 4, deckCount: 22 },
    croco_leather: { id: "croco_leather", name: "Cuir de croco", type: "CONTRABAND", icon: "🐊", value: 7, fine: 4, deckCount: 21 },
    cocaine: { id: "cocaine", name: "Cocaine", type: "CONTRABAND", icon: "❄️", value: 8, fine: 4, deckCount: 12 },
    artwork: { id: "artwork", name: "Œuvres d'art", type: "CONTRABAND", icon: "🖼️", value: 9, fine: 4, deckCount: 5 }
  }
};

export function getCardDefinition(cardId: string, theme: DeckTheme = 'WESTERN'): Omit<Card, "uid" | "cardId"> | undefined {
  return CARD_THEMES[theme][cardId];
}

export function shuffleDeck(array: Card[]): Card[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createDeck(theme: DeckTheme = 'WESTERN'): Card[] {
  const deck: Card[] = [];
  let uidCounter = 1;
  const definitions = CARD_THEMES[theme];
  Object.values(definitions).forEach((cardDef) => {
    for (let i = 0; i < cardDef.deckCount; i++) {
      deck.push({
        uid: `${cardDef.id}_${uidCounter++}`,
        cardId: cardDef.id,
        ...cardDef,
      } as Card);
    }
  });
  return shuffleDeck(deck);
}

