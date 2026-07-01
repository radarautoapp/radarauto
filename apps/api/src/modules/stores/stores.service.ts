/**
 * StoresService
 *
 * Operações na loja do user autenticado.
 * Regras:
 *  - Só lojista (role) com storeId pode editar
 *  - cnpj, legalName, tradeName, city, state, since vêm da Receita → não editáveis
 *  - name (display) editável; initials recalculadas automaticamente
 *  - phone e whatsapp exigem token de verificação SMS pra novo número
 *  - email e description editáveis direto
 *  - logo: upload + redimensionamento (sharp → 400x400 WebP)
 */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Store } from "@prisma/client";
import sharp from "sharp";

import { PrismaService } from "../../prisma/prisma.service";
import { SafeUser } from "../auth/auth.service";
import { IStorageService, STORAGE_SERVICE } from "../storage/storage.interface";
import { VerificationService } from "../verification/verification.service";
import { UpdateStoreDto } from "./dto/update-store.dto";

const LOGO_ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const LOGO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB original — sharp comprime depois
const LOGO_MIN_DIMENSION = 200;
const LOGO_OUTPUT_DIMENSION = 400;

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async getMine(user: SafeUser): Promise<Store> {
    this.assertCanManage(user);
    const store = await this.prisma.store.findUnique({
      where: { id: user.storeId! },
    });
    if (!store) {
      throw new NotFoundException({
        code: "STORE_NOT_FOUND",
        message: "Loja não encontrada.",
      });
    }
    return store;
  }

  async updateMine(user: SafeUser, dto: UpdateStoreDto): Promise<Store> {
    this.assertCanManage(user);
    const storeId = user.storeId!;

    const data: Partial<{
      name: string;
      initials: string;
      phone: string;
      whatsapp: string;
      email: string | null;
      description: string | null;
    }> = {};

    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (trimmed.length >= 2) {
        data.name = trimmed;
        data.initials = computeInitials(trimmed);
      }
    }

    // SMS desabilitado: aceita novo telefone sem verificacao. TODO: reativar.
    if (dto.phone !== undefined) {
      if (dto.phoneVerificationToken) {
        await this.verificationService.consumeToken(dto.phoneVerificationToken, "phone", dto.phone);
      }
      data.phone = dto.phone.replace(/\D/g, "");
    }

    // SMS desabilitado: aceita novo whatsapp sem verificacao. TODO: reativar.
    if (dto.whatsapp !== undefined) {
      if (dto.whatsappVerificationToken) {
        await this.verificationService.consumeToken(
          dto.whatsappVerificationToken,
          "phone",
          dto.whatsapp,
        );
      }
      data.whatsapp = dto.whatsapp.replace(/\D/g, "");
    }

    if (dto.email !== undefined) {
      const trimmed = dto.email.trim();
      data.email = trimmed.length > 0 ? trimmed.toLowerCase() : null;
    }

    if (dto.description !== undefined) {
      const trimmed = dto.description.trim();
      data.description = trimmed.length > 0 ? trimmed : null;
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.store.findUniqueOrThrow({ where: { id: storeId } });
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data,
    });

    this.logger.log({
      msg: "store.updated",
      storeId,
      userId: user.id,
      fields: Object.keys(data),
    });

    return updated;
  }

  async uploadLogo(user: SafeUser, file: Express.Multer.File): Promise<Store> {
    this.assertCanManage(user);
    const storeId = user.storeId!;

    if (!file) {
      throw new BadRequestException({
        code: "LOGO_NO_FILE",
        message: "Nenhum arquivo enviado.",
      });
    }

    if (!LOGO_ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException({
        code: "LOGO_INVALID_TYPE",
        message: "Formato inválido. Use JPEG, PNG ou WebP.",
      });
    }

    if (file.size > LOGO_MAX_BYTES) {
      throw new BadRequestException({
        code: "LOGO_TOO_LARGE",
        message: `Arquivo muito grande. Máximo ${LOGO_MAX_BYTES / 1024 / 1024} MB.`,
      });
    }

    // Processa com sharp: valida dimensões, redimensiona, converte pra WebP
    let processed: Buffer;
    try {
      const meta = await sharp(file.buffer).metadata();
      if (
        !meta.width ||
        !meta.height ||
        meta.width < LOGO_MIN_DIMENSION ||
        meta.height < LOGO_MIN_DIMENSION
      ) {
        throw new BadRequestException({
          code: "LOGO_TOO_SMALL",
          message: `Imagem muito pequena. Mínimo ${LOGO_MIN_DIMENSION}×${LOGO_MIN_DIMENSION} pixels.`,
        });
      }
      processed = await sharp(file.buffer)
        .resize(LOGO_OUTPUT_DIMENSION, LOGO_OUTPUT_DIMENSION, {
          fit: "cover",
          position: "centre",
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.warn({ msg: "logo.sharp.failed", error: String(err) });
      throw new BadRequestException({
        code: "LOGO_PROCESSING_FAILED",
        message: "Não foi possível processar a imagem. Tente outra.",
      });
    }

    // Apaga logo antigo se houver
    const current = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
    });
    if (current.logoUrl) {
      const oldKey = this.storage.extractKey(current.logoUrl);
      if (oldKey) {
        await this.storage.delete(oldKey);
      }
    }

    // Sobe o novo
    const key = `logos/${storeId}-${Date.now()}.webp`;
    const result = await this.storage.upload({
      key,
      buffer: processed,
      contentType: "image/webp",
    });

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: { logoUrl: result.url },
    });

    this.logger.log({
      msg: "store.logo.uploaded",
      storeId,
      userId: user.id,
      key,
      sizeKb: Math.round(processed.length / 1024),
    });

    return updated;
  }

  async removeLogo(user: SafeUser): Promise<Store> {
    this.assertCanManage(user);
    const storeId = user.storeId!;

    const current = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
    });

    if (current.logoUrl) {
      const key = this.storage.extractKey(current.logoUrl);
      if (key) {
        await this.storage.delete(key);
      }
    }

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: { logoUrl: null },
    });

    this.logger.log({ msg: "store.logo.removed", storeId, userId: user.id });

    return updated;
  }

  /**
   * [ADMIN] Metricas gerais da plataforma para o dashboard.
   * Contagens simples (sem cache) - MVP.
   */
  async getAdminOverview(): Promise<{
    storesTotal: number;
    storesApproved: number;
    storesPending: number;
    vehiclesActive: number;
    vehiclesNew7d: number;
    buyersTotal: number;
    buyersNew7d: number;
    leadsTotal: number;
    leadsNew7d: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      storesTotal,
      storesApproved,
      storesPending,
      vehiclesActive,
      vehiclesNew7d,
      buyersTotal,
      buyersNew7d,
      leadsTotal,
      leadsNew7d,
    ] = await Promise.all([
      this.prisma.store.count({ where: { deletedAt: null } }),
      this.prisma.store.count({ where: { deletedAt: null, sellingStatus: "APPROVED" } }),
      this.prisma.store.count({ where: { deletedAt: null, sellingStatus: "NONE" } }),
      this.prisma.listing.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      this.prisma.vehicle.count({ where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { deletedAt: null, role: "revendedor" } }),
      this.prisma.user.count({
        where: { deletedAt: null, role: "revendedor", createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.lead.count({ where: { deletedAt: null } }),
      this.prisma.lead.count({ where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
    ]);

    return {
      storesTotal,
      storesApproved,
      storesPending,
      vehiclesActive,
      vehiclesNew7d,
      buyersTotal,
      buyersNew7d,
      leadsTotal,
      leadsNew7d,
    };
  }

  /**
   * [ADMIN] Dashboard completo: crescimento diario, vendas, ranking de
   * lojas, geografia, funil de leads, desconto medio vs FIPE, e MRR
   * estimado (sem Stripe ainda - baseado em subscriptionStatus=active).
   * Tudo em paralelo. MVP: sem cache.
   */
  async getAdminOverviewFull(): Promise<{
    storesTotal: number;
    storesApproved: number;
    storesPending: number;
    vehiclesActive: number;
    vehiclesNew7d: number;
    buyersTotal: number;
    buyersNew7d: number;
    leadsTotal: number;
    leadsNew7d: number;
    soldTotal: number;
    soldThisMonth: number;
    avgDiscountPercent: number | null;
    growth: Array<{ date: string; stores: number; vehicles: number; leads: number }>;
    topStores: Array<{ id: string; name: string; activeVehicles: number }>;
    byState: Array<{ state: string; stores: number; vehicles: number }>;
    leadFunnel: { hot: number; warm: number; cold: number };
    mrrEstimateCents: number;
    activeSubscribers: number;
    mrrTrend: Array<{ weekStart: string; newSubscribers: number }>;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      storesTotal,
      storesApproved,
      storesPending,
      vehiclesActive,
      vehiclesNew7d,
      buyersTotal,
      buyersNew7d,
      leadsTotal,
      leadsNew7d,
      soldTotal,
      soldThisMonth,
      activeVehiclesForDiscount,
      recentStores,
      recentVehicles,
      recentLeads,
      storesWithVehicleCounts,
      leadsByScore,
      activeSubs,
      recentSubs,
    ] = await Promise.all([
      this.prisma.store.count({ where: { deletedAt: null } }),
      this.prisma.store.count({ where: { deletedAt: null, sellingStatus: "APPROVED" } }),
      this.prisma.store.count({ where: { deletedAt: null, sellingStatus: "NONE" } }),
      this.prisma.listing.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      this.prisma.vehicle.count({ where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { deletedAt: null, role: "revendedor" } }),
      this.prisma.user.count({
        where: { deletedAt: null, role: "revendedor", createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.lead.count({ where: { deletedAt: null } }),
      this.prisma.lead.count({ where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.listing.count({ where: { deletedAt: null, soldAt: { not: null } } }),
      this.prisma.listing.count({
        where: { deletedAt: null, soldAt: { gte: startOfMonth } },
      }),
      this.prisma.vehicle.findMany({
        where: { deletedAt: null, listing: { status: "ACTIVE" } },
        select: { price: true, fipe: true },
      }),
      this.prisma.store.findMany({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      this.prisma.vehicle.findMany({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      this.prisma.lead.findMany({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      this.prisma.store.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          state: true,
          vehicles: {
            where: { deletedAt: null, listing: { status: "ACTIVE" } },
            select: { id: true },
          },
        },
      }),
      this.prisma.lead.groupBy({
        by: ["score"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null, subscriptionStatus: "active" },
        select: { subscriptionCycle: true },
      }),
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          subscriptionStatus: "active",
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
      }),
    ]);

    // Desconto medio (price vs fipe) dos veiculos ativos
    let avgDiscountPercent: number | null = null;
    if (activeVehiclesForDiscount.length > 0) {
      const pct = activeVehiclesForDiscount
        .filter((v) => v.fipe > 0)
        .map((v) => ((v.fipe - v.price) / v.fipe) * 100);
      if (pct.length > 0) {
        avgDiscountPercent = pct.reduce((a, b) => a + b, 0) / pct.length;
      }
    }

    // Crescimento diario (ultimos 30 dias)
    const dayKey = (d: Date): string => d.toISOString().slice(0, 10);
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(dayKey(d));
    }
    const countByDay = (items: { createdAt: Date }[]): Map<string, number> => {
      const map = new Map<string, number>();
      for (const it of items) {
        const k = dayKey(it.createdAt);
        map.set(k, (map.get(k) ?? 0) + 1);
      }
      return map;
    };
    const storesByDay = countByDay(recentStores);
    const vehiclesByDay = countByDay(recentVehicles);
    const leadsByDay = countByDay(recentLeads);
    const growth = days.map((date) => ({
      date,
      stores: storesByDay.get(date) ?? 0,
      vehicles: vehiclesByDay.get(date) ?? 0,
      leads: leadsByDay.get(date) ?? 0,
    }));

    // Top 5 lojas por veiculos ativos
    const topStores = storesWithVehicleCounts
      .map((s) => ({ id: s.id, name: s.name, activeVehicles: s.vehicles.length }))
      .sort((a, b) => b.activeVehicles - a.activeVehicles)
      .slice(0, 5);

    // Por estado
    const stateMap = new Map<string, { stores: number; vehicles: number }>();
    for (const s of storesWithVehicleCounts) {
      const cur = stateMap.get(s.state) ?? { stores: 0, vehicles: 0 };
      cur.stores += 1;
      cur.vehicles += s.vehicles.length;
      stateMap.set(s.state, cur);
    }
    const byState = Array.from(stateMap.entries())
      .map(([state, v]) => ({ state, ...v }))
      .sort((a, b) => b.vehicles - a.vehicles);

    // Funil de leads
    const leadFunnel = { hot: 0, warm: 0, cold: 0 };
    for (const row of leadsByScore) {
      const key = row.score.toLowerCase() as "hot" | "warm" | "cold";
      leadFunnel[key] = row._count._all;
    }

    // MRR estimado (assinantes ativos x preco do ciclo)
    const CYCLE_PRICE_CENTS: Record<string, number> = {
      monthly: 9900,
      quarterly: 7990,
      yearly: 6990,
    };
    let mrrEstimateCents = 0;
    for (const sub of activeSubs) {
      const cycle = sub.subscriptionCycle ?? "monthly";
      mrrEstimateCents += CYCLE_PRICE_CENTS[cycle] ?? CYCLE_PRICE_CENTS.monthly!;
    }

    // Tendencia de novos assinantes por semana (ultimas ~4 semanas), pra projecao simples
    const weekKey = (d: Date): string => {
      const monday = new Date(d);
      const day = monday.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      monday.setDate(monday.getDate() + diff);
      return dayKey(monday);
    };
    const weekMap = new Map<string, number>();
    for (const sub of recentSubs) {
      const k = weekKey(sub.createdAt);
      weekMap.set(k, (weekMap.get(k) ?? 0) + 1);
    }
    const mrrTrend = Array.from(weekMap.entries())
      .map(([weekStart, newSubscribers]) => ({ weekStart, newSubscribers }))
      .sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));

    return {
      storesTotal,
      storesApproved,
      storesPending,
      vehiclesActive,
      vehiclesNew7d,
      buyersTotal,
      buyersNew7d,
      leadsTotal,
      leadsNew7d,
      soldTotal,
      soldThisMonth,
      avgDiscountPercent,
      growth,
      topStores,
      byState,
      leadFunnel,
      mrrEstimateCents,
      activeSubscribers: activeSubs.length,
      mrrTrend,
    };
  }

  private assertCanManage(user: SafeUser): void {
    if (user.role !== "lojista" || !user.storeId) {
      throw new ForbiddenException({
        code: "STORE_ACCESS_DENIED",
        message: "Apenas o lojista pode gerenciar a loja.",
      });
    }
  }

  /**
   * [ADMIN] Lista todas as lojas com o lojista dono (nome/email), para a
   * tela de gestao de permissao de venda. Sem paginacao (MVP).
   */
  async listAllForAdmin(): Promise<
    Array<{
      id: string;
      name: string;
      cnpj: string;
      city: string;
      state: string;
      sellingStatus: string;
      createdAt: Date;
      ownerEmail: string | null;
      ownerName: string | null;
      logoUrl: string | null;
    }>
  > {
    const stores = await this.prisma.store.findMany({
      where: { deletedAt: null },
      include: {
        users: {
          where: { role: "lojista" },
          select: { email: true, name: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return stores.map((st) => ({
      id: st.id,
      name: st.name,
      cnpj: st.cnpj,
      city: st.city,
      state: st.state,
      sellingStatus: st.sellingStatus,
      createdAt: st.createdAt,
      ownerEmail: st.users[0]?.email ?? null,
      ownerName: st.users[0]?.name ?? null,
      logoUrl: st.logoUrl,
    }));
  }

  /**
   * [ADMIN] Aprova ou revoga a permissao de venda de uma loja diretamente
   * (nao passa por PENDING - decisao e 100% do admin, Regra 3.4).
   */
  async setSellingStatus(storeId: string, approved: boolean): Promise<Store> {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException({
        code: "STORE_NOT_FOUND",
        message: "Loja não encontrada.",
      });
    }
    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: { sellingStatus: approved ? "APPROVED" : "NONE" },
    });
    this.logger.log({
      msg: "store.selling.status_changed_by_admin",
      storeId,
      sellingStatus: updated.sellingStatus,
    });
    return updated;
  }
}

function computeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) {
    return words[0]!.slice(0, 2).toUpperCase();
  }
  return ((words[0]![0] ?? "") + (words[1]![0] ?? "")).toUpperCase();
}
