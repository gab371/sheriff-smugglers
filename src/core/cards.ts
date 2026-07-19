import type { Card } from "./types";

export const GOOD_TYPES = {
  LEGAL: 'LEGAL' as const,
  CONTRABAND: 'CONTRABAND' as const,
};

export const CARD_DEFINITIONS: { [cardId: string]: Omit<Card, "uid" | "cardId"> } = {
  apple: {
    id: 'apple',
    name: 'Pommes',
    type: 'LEGAL',
    icon: '🍎',
    value: 2,
    fine: 2,
    deckCount: 48,
    kingBonus: 20,
    queenBonus: 10,
  },
  cheese: {
    id: 'cheese',
    name: 'Fromage',
    type: 'LEGAL',
    icon: '🧀',
    value: 3,
    fine: 2,
    deckCount: 36,
    kingBonus: 15,
    queenBonus: 10,
  },
  bread: {
    id: 'bread',
    name: 'Pain',
    type: 'LEGAL',
    icon: '🍞',
    value: 3,
    fine: 2,
    deckCount: 36,
    kingBonus: 15,
    queenBonus: 10,
  },
  chicken: {
    id: 'chicken',
    name: 'Poulet',
    type: 'LEGAL',
    icon: '🍗',
    value: 4,
    fine: 2,
    deckCount: 24,
    kingBonus: 10,
    queenBonus: 5,
  },
  pepper: {
    id: 'pepper',
    name: 'Poivre',
    type: 'CONTRABAND',
    icon: '🌶️',
    value: 6,
    fine: 4,
    deckCount: 22,
  },
  mead: {
    id: 'mead',
    name: 'Whisky (Hydromel)',
    type: 'CONTRABAND',
    icon: '🥃',
    value: 7,
    fine: 4,
    deckCount: 21,
  },
  silk: {
    id: 'silk',
    name: 'Soie',
    type: 'CONTRABAND',
    icon: '👗',
    value: 8,
    fine: 4,
    deckCount: 12,
  },
  crossbow: {
    id: 'crossbow',
    name: 'Revolver',
    type: 'CONTRABAND',
    icon: '🔫',
    value: 9,
    fine: 4,
    deckCount: 5,
  },
};

export function shuffleDeck(array: Card[]): Card[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let uidCounter = 1;
  Object.values(CARD_DEFINITIONS).forEach((cardDef) => {
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
