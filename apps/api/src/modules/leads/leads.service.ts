/**
 * LeadsService
 *
 * Engine de leads: cada interessado (usuário logado) acumula sinais de
 * comportamento por anúncio (Lead único por listing × visitante). Cada evento
 * (view, tempo, favorito, contato) atualiza o Lead e recalcula o score.
 *
 * O score (COLD/WARM/HOT) vem de lead-score.ts (lógica pura, testável).
 */
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { SafeUser } from "../auth/auth.service";

import { PrismaService } from "../../prisma/prisma.service";
import { computeLeadPoints, computeLeadScore } from "./lead-score";

/** Eventos que alimentam o engine. */
export type LeadEvent =
  | { type: "view" }
  | { type: "time"; seconds: number }
  | { type: "favorite"; value: boolean }
  | { type: "contact"; channel: "whatsapp" | "telegram" };

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra um evento de comportamento do usuário em um anúncio, fazendo
   * upsert do Lead e recalculando o score. Best-effort: não deve quebrar a
   * navegação do usuário (o controller decide como tratar erros).
   */
  async track(user: SafeUser, vehicleId: string, event: LeadEvent): Promise<void> {
    // Resolve o listing a partir do vehicleId (a UI conhece o veículo).
    const listing = await this.prisma.listing.findFirst({
      where: { vehicleId, deletedAt: null },
      select: { id: true, createdById: true },
    });
    if (!listing) {
      throw new NotFoundException({
        code: "LISTING_NOT_FOUND",
        message: "Anúncio não encontrado.",
      });
    }

    // O lead é único por (listing × visitante). visitorId = id do usuário logado.
    const existing = await this.prisma.lead.findFirst({
      where: { listingId: listing.id, visitorId: user.id, deletedAt: null },
    });

    const now = new Date();

    // Estado base (existente ou novo).
    const base = existing ?? {
      clicks: 0,
      avgTimeSeconds: 0,
      favorited: false,
      whatsappClicked: false,
      telegramClicked: false,
      lastSeen: now,
    };

    // Aplica o evento sobre o estado base.
    const next = {
      clicks: base.clicks,
      avgTimeSeconds: base.avgTimeSeconds,
      favorited: base.favorited,
      whatsappClicked: base.whatsappClicked,
      telegramClicked: base.telegramClicked,
      lastSeen: now, // qualquer evento atualiza a recência
    };

    switch (event.type) {
      case "view":
        next.clicks = base.clicks + 1;
        break;
      case "time":
        // acumula o tempo total na tela (não é média móvel; somatório)
        next.avgTimeSeconds = base.avgTimeSeconds + Math.max(0, Math.round(event.seconds));
        break;
      case "favorite":
        next.favorited = event.value;
        break;
      case "contact":
        if (event.channel === "whatsapp") next.whatsappClicked = true;
        else next.telegramClicked = true;
        break;
    }

    const score = computeLeadScore({ ...next, now });

    if (existing) {
      await this.prisma.lead.update({
        where: { id: existing.id },
        data: { ...next, score },
      });
    } else {
      await this.prisma.lead.create({
        data: {
          listingId: listing.id,
          visitorId: user.id,
          name: user.name,
          ...next,
          score,
        },
      });
    }
  }

  /**
   * Lista os veículos da loja do usuário com seus leads agrupados, para a tela
   * de leads (acordeon). Cada veículo traz um resumo (total, HOT) e a lista de
   * leads ordenada por engajamento (pontos desc). Telefone só é exposto para
   * leads que tentaram contato (intenção explícita — LGPD).
   */
  async listForStore(user: SafeUser) {
    if (!user.storeId) {
      throw new ForbiddenException({
        code: "NO_STORE",
        message: "Você não tem uma loja associada.",
      });
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where: { storeId: user.storeId, deletedAt: null },
      select: {
        id: true,
        brand: true,
        model: true,
        version: true,
        year: true,
        photos: true,
        price: true,
        listing: {
          select: {
            id: true,
            leads: {
              where: { deletedAt: null },
              select: {
                id: true,
                visitorId: true,
                name: true,
                score: true,
                clicks: true,
                avgTimeSeconds: true,
                favorited: true,
                whatsappClicked: true,
                telegramClicked: true,
                lastSeen: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    // Para exibir telefone (só de quem contatou), buscamos os telefones dos
    // visitantes relevantes em lote.
    const contactVisitorIds = new Set<string>();
    for (const v of vehicles) {
      for (const l of v.listing?.leads ?? []) {
        if (l.whatsappClicked || l.telegramClicked) contactVisitorIds.add(l.visitorId);
      }
    }
    const phoneById = new Map<string, string>();
    if (contactVisitorIds.size > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: Array.from(contactVisitorIds) } },
        select: { id: true, phone: true },
      });
      for (const u of users) {
        if (u.phone) phoneById.set(u.id, u.phone);
      }
    }

    const items = vehicles.map((v) => {
      const leads = (v.listing?.leads ?? [])
        .map((l) => {
          const points = computeLeadPoints({
            clicks: l.clicks,
            avgTimeSeconds: l.avgTimeSeconds,
            favorited: l.favorited,
            whatsappClicked: l.whatsappClicked,
            telegramClicked: l.telegramClicked,
            lastSeen: l.lastSeen,
            now,
          });
          const contacted = l.whatsappClicked || l.telegramClicked;
          return {
            id: l.id,
            name: l.name,
            phone: contacted ? (phoneById.get(l.visitorId) ?? null) : null,
            score: l.score,
            points,
            clicks: l.clicks,
            timeSeconds: l.avgTimeSeconds,
            favorited: l.favorited,
            whatsappClicked: l.whatsappClicked,
            telegramClicked: l.telegramClicked,
            lastSeen: l.lastSeen.toISOString(),
          };
        })
        .sort((a, b) => b.points - a.points);

      const hotCount = leads.filter((l) => l.score === "HOT").length;

      return {
        vehicleId: v.id,
        brand: v.brand,
        model: v.model,
        version: v.version,
        year: v.year,
        price: v.price,
        coverPhoto: v.photos[0] ?? null,
        totalLeads: leads.length,
        hotCount,
        leads,
      };
    });

    // Veículos com mais leads quentes primeiro; depois por total de leads.
    items.sort((a, b) => b.hotCount - a.hotCount || b.totalLeads - a.totalLeads);

    const totalLeads = items.reduce((acc, it) => acc + it.totalLeads, 0);
    const totalHot = items.reduce((acc, it) => acc + it.hotCount, 0);

    return { items, totalLeads, totalHot };
  }
}
