/**
 * lead-score tests
 *
 * Cobertura da regra de negócio crítica (qualificação de leads). Valida cada
 * bloco de pontuação, as fronteiras das faixas e a regra de piso (contato = HOT).
 */
import {
  clicksScore,
  computeLeadPoints,
  computeLeadScore,
  LEAD_WEIGHTS,
  pointsToLabel,
  recencyScore,
  timeScore,
  type LeadSignals,
} from "./lead-score";

const NOW = new Date("2026-06-01T12:00:00.000Z");

/** Sinais base (lead "vazio"), sobrescrevíveis por teste. */
function signals(over: Partial<LeadSignals> = {}): LeadSignals {
  return {
    clicks: 0,
    avgTimeSeconds: 0,
    favorited: false,
    whatsappClicked: false,
    telegramClicked: false,
    lastSeen: NOW,
    now: NOW,
    ...over,
  };
}

describe("lead-score", () => {
  describe("clicksScore", () => {
    it("é 0 com nenhum clique", () => {
      expect(clicksScore(0)).toBe(0);
    });

    it("cresce com os cliques e satura no peso máximo", () => {
      expect(clicksScore(1)).toBeGreaterThan(0);
      expect(clicksScore(6)).toBeCloseTo(LEAD_WEIGHTS.clicks, 5);
      // acima da saturação não passa do teto
      expect(clicksScore(50)).toBeLessThanOrEqual(LEAD_WEIGHTS.clicks);
    });

    it("trata cliques negativos como zero", () => {
      expect(clicksScore(-3)).toBe(0);
    });
  });

  describe("timeScore", () => {
    it("é 0 sem tempo", () => {
      expect(timeScore(0)).toBe(0);
    });

    it("satura em ~5 minutos (300s)", () => {
      expect(timeScore(300)).toBeCloseTo(LEAD_WEIGHTS.time, 5);
      expect(timeScore(600)).toBe(LEAD_WEIGHTS.time);
    });

    it("é proporcional abaixo da saturação", () => {
      expect(timeScore(150)).toBeCloseTo(LEAD_WEIGHTS.time / 2, 1);
    });
  });

  describe("recencyScore", () => {
    it("é máximo quando visto agora", () => {
      expect(recencyScore(NOW, NOW)).toBeCloseTo(LEAD_WEIGHTS.recency, 5);
    });

    it("decai pela metade em ~7 dias", () => {
      const sevenDaysAgo = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000);
      expect(recencyScore(sevenDaysAgo, NOW)).toBeCloseTo(LEAD_WEIGHTS.recency / 2, 1);
    });

    it("é 0 após 14 dias", () => {
      const old = new Date(NOW.getTime() - 20 * 24 * 60 * 60 * 1000);
      expect(recencyScore(old, NOW)).toBe(0);
    });
  });

  describe("pointsToLabel", () => {
    it("classifica nas fronteiras corretas", () => {
      expect(pointsToLabel(0)).toBe("COLD");
      expect(pointsToLabel(29.9)).toBe("COLD");
      expect(pointsToLabel(30)).toBe("WARM");
      expect(pointsToLabel(64.9)).toBe("WARM");
      expect(pointsToLabel(65)).toBe("HOT");
      expect(pointsToLabel(100)).toBe("HOT");
    });
  });

  describe("computeLeadPoints", () => {
    it("retorna 0 para um lead sem nenhum sinal e sem recência", () => {
      const old = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
      expect(computeLeadPoints(signals({ lastSeen: old }))).toBe(0);
    });

    it("nunca passa de 100 (super engajado)", () => {
      const pts = computeLeadPoints(
        signals({
          clicks: 20,
          avgTimeSeconds: 1000,
          favorited: true,
          whatsappClicked: true,
          telegramClicked: true,
        }),
      );
      expect(pts).toBeLessThanOrEqual(100);
    });
  });

  describe("computeLeadScore — cenários calibrados", () => {
    it("olhada rápida (1 clique, 20s, hoje) → COLD", () => {
      expect(computeLeadScore(signals({ clicks: 1, avgTimeSeconds: 20 }))).toBe("COLD");
    });

    it("engajado sem contato (3 visitas, 2min, favoritou, ontem) → WARM", () => {
      const yesterday = new Date(NOW.getTime() - 24 * 60 * 60 * 1000);
      expect(
        computeLeadScore(
          signals({ clicks: 3, avgTimeSeconds: 120, favorited: true, lastSeen: yesterday }),
        ),
      ).toBe("WARM");
    });

    it("visto há 10 dias, pouca atividade → COLD", () => {
      const old = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
      expect(computeLeadScore(signals({ clicks: 2, avgTimeSeconds: 60, lastSeen: old }))).toBe(
        "COLD",
      );
    });

    it("super engajado (tudo) → HOT", () => {
      expect(
        computeLeadScore(
          signals({
            clicks: 5,
            avgTimeSeconds: 360,
            favorited: true,
            whatsappClicked: true,
          }),
        ),
      ).toBe("HOT");
    });
  });

  describe("computeLeadScore — regra de piso (contato = HOT)", () => {
    it("clique no WhatsApp garante HOT mesmo com o resto zerado", () => {
      expect(computeLeadScore(signals({ whatsappClicked: true }))).toBe("HOT");
    });

    it("clique no Telegram garante HOT mesmo com o resto zerado", () => {
      expect(computeLeadScore(signals({ telegramClicked: true }))).toBe("HOT");
    });

    it("contato com lead frio e antigo ainda é HOT", () => {
      const old = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
      expect(computeLeadScore(signals({ clicks: 1, lastSeen: old, whatsappClicked: true }))).toBe(
        "HOT",
      );
    });
  });
});
