import type { Player, WinnerScore } from "./types";
import { CARD_DEFINITIONS } from "./cards";

export function calculateFinalScores(players: Player[]): WinnerScore[] {
  const legalGoodTypes = Object.keys(CARD_DEFINITIONS).filter(
    (key) => CARD_DEFINITIONS[key].type === 'LEGAL'
  );

  const scores: WinnerScore[] = players.map((p) => {
    let standValue = 0;
    const counts: { [goodId: string]: number } = {};
    const standDetails: string[] = [];

    legalGoodTypes.forEach((type) => {
      const items = p.stand?.[type] || [];
      counts[type] = items.length;
      const val = items.length * CARD_DEFINITIONS[type].value;
      standValue += val;
      if (items.length > 0) {
        standDetails.push(
          `${items.length} ${CARD_DEFINITIONS[type].name}(s) ${CARD_DEFINITIONS[type].icon} (${val} pts)`
        );
      }
    });

    let contrabandValue = 0;
    const contrabandDetails: string[] = [];
    (p.contraband || []).forEach((card) => {
      contrabandValue += card.value;
      contrabandDetails.push(
        `${card.name} ${card.icon} (${card.value} pts)`
      );
    });

    return {
      playerId: p.id,
      name: p.name,
      avatar: p.avatar,
      coins: p.gold || 0,
      standValue,
      standDetails,
      contrabandValue,
      contrabandDetails,
      counts,
      kingBonuses: 0,
      queenBonuses: 0,
      bonusList: [],
      totalScore: 0,
    };
  });

  legalGoodTypes.forEach((type) => {
    const cardDef = CARD_DEFINITIONS[type];
    const sorted = [...scores].sort((a, b) => b.counts[type] - a.counts[type]);

    if (sorted[0] && sorted[0].counts[type] > 0) {
      const highestCount = sorted[0].counts[type];
      const kings = sorted.filter((s) => s.counts[type] === highestCount);

      if (kings.length === 1) {
        kings[0].kingBonuses += cardDef.kingBonus || 0;
        kings[0].bonusList.push(
          `Roi ${cardDef.name} ${cardDef.icon} (+${cardDef.kingBonus} pts)`
        );

        const remaining = sorted.filter(
          (s) => s.counts[type] < highestCount && s.counts[type] > 0
        );
        if (remaining.length > 0) {
          const secondHighest = remaining[0].counts[type];
          const queens = remaining.filter((s) => s.counts[type] === secondHighest);
          const queenBonusSplit = Math.floor((cardDef.queenBonus || 0) / queens.length);
          const queenTitle = queens.length > 1 ? 'Égalité Reine' : 'Reine';
          queens.forEach((q) => {
            q.queenBonuses += queenBonusSplit;
            q.bonusList.push(
              `${queenTitle} ${cardDef.name} ${cardDef.icon} (+${queenBonusSplit} pts)`
            );
          });
        }
      } else {
        const totalBonus = (cardDef.kingBonus || 0) + (cardDef.queenBonus || 0);
        const splitBonus = Math.floor(totalBonus / kings.length);
        kings.forEach((k) => {
          k.kingBonuses += splitBonus;
          k.bonusList.push(
            `Égalité Roi ${cardDef.name} ${cardDef.icon} (+${splitBonus} pts)`
          );
        });
      }
    }
  });

  scores.forEach((s) => {
    s.totalScore =
      s.coins + s.standValue + s.contrabandValue + s.kingBonuses + s.queenBonuses;
  });

  scores.sort((a, b) => b.totalScore - a.totalScore);
  return scores;
}
