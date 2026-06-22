/**
 * /app/catalogo/[id] — Detalhe do veículo.
 *
 * Faixa hero: galeria 4:3 + card de preço/contato (mesma altura, card rola
 * internamente). Abaixo, full width: thumbs, ficha técnica, opcionais, obs,
 * insights e similares. Paywall: galeria limitada, vendedor e insights são
 * premium (gating real — backend não envia esses dados para FREE).
 */
"use client";

import {
  ArrowLeft,
  Calendar,
  Car,
  Check,
  ChevronRight,
  Cog,
  Crown,
  Eye,
  Flame,
  Fuel,
  Gauge,
  Lock,
  MapPin,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { VehicleDetail } from "@radar/types";
import { Badge, Button, Skeleton, TelegramIcon, WhatsAppIcon } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { leadsApi } from "@/lib/leads-api";
import { usePageTime } from "@/lib/usePageTime";

import { catalogApi } from "../_lib/catalog-api";
import { GalleryMain, GalleryThumbs } from "../_components/VehicleGallery";

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const num = (n: number) => n.toLocaleString("pt-BR");

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  // Registra a visita ao anúncio (engine de leads, best-effort).
  useEffect(() => {
    if (id) void leadsApi.view(id);
  }, [id]);

  // Mede o tempo de tela (só com aba visível) e envia ao sair.
  usePageTime(id, (vehicleId, seconds) => leadsApi.time(vehicleId, seconds));

  const [v, setV] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Sincroniza alturas: a galeria (4:3) e o card podem ter alturas diferentes.
  // Medimos os dois e usamos a MAIOR como altura comum — assim ficam sempre
  // iguais, sem cortar conteudo do card nem distorcer a galeria.
  const galleryRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState<number | undefined>(undefined);
  useEffect(() => {
    const g = galleryRef.current;
    const c = cardRef.current;
    if (!g || !c) return;
    const update = () => {
      // mede a altura natural de cada um (sem o lock atual) e usa a maior
      const gh = g.scrollHeight;
      const ch = c.scrollHeight;
      setRowHeight(Math.max(gh, ch));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(c);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [v]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await catalogApi.detail(id);
      setV(res.vehicle);
      setPhotoIndex(0);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const goPlans = useCallback(() => router.push("/app/planos"), [router]);

  if (loading) {
    return (
      <div className="page-wrap">
        <Skeleton height={24} />
        <div style={{ height: 14 }} />
        <Skeleton height={360} />
      </div>
    );
  }

  if (error || !v) {
    return (
      <div className="page-wrap dt-error">
        <Car size={44} strokeWidth={1.4} />
        <h2>Veículo indisponível</h2>
        <p className="muted">{error ?? "Este anúncio não está mais disponível."}</p>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => router.push("/app/catalogo")}>
          Voltar ao catálogo
        </Button>
      </div>
    );
  }

  const savings = v.fipe > v.price ? v.fipe - v.price : 0;
  const isOpportunity = v.diff <= -20;

  return (
    <div className="page-wrap dt">
      <button className="dt-back" onClick={() => router.push("/app/catalogo")}>
        <ArrowLeft size={16} />
        Voltar ao catálogo
      </button>

      {/* Header */}
      <div className="dt-head">
        <h1 className="dt-title">
          {v.brand} {v.model}
        </h1>
        <div className="dt-version">{v.version}</div>
      </div>

      {/* Faixa hero: galeria 4:3 + card (mesma altura) */}
      <div className="dt-hero">
        <div className="dt-left">
          <div
            className="dt-gallery"
            ref={galleryRef}
            style={rowHeight ? { height: rowHeight } : undefined}
          >
            <GalleryMain v={v} i={photoIndex} setI={setPhotoIndex} onUpgrade={goPlans} />
          </div>
          <GalleryThumbs v={v} i={photoIndex} setI={setPhotoIndex} onUpgrade={goPlans} />
        </div>

        <aside className="dt-side" ref={cardRef}>
          <div className="card dt-price-card">
            <div className="dt-price-top">
              <div className="dt-price-label micro">Preço</div>
              <div className="dt-price">R$ {brl(v.price)}</div>
              {v.fipe > 0 && (
                <div className="dt-fipe">
                  Tabela FIPE <b>R$ {brl(v.fipe)}</b>
                </div>
              )}
              {savings > 0 && (
                <div className="dt-savings">
                  <Zap size={14} />
                  R$ {brl(savings)} abaixo da FIPE ({v.diff}%)
                </div>
              )}
            </div>

            <div className="dt-divider" />

            <ContactBlock
              v={v}
              onUpgrade={goPlans}
              onStore={() => router.push(`/app/catalogo?store=${v.storeId}`)}
            />
          </div>
        </aside>
      </div>

      {/* Conteúdo abaixo */}
      <div className="dt-body">
        <div className="card dt-card">
          <span className="micro">Ficha técnica</span>
          <div className="dt-specs">
            <SpecTile icon={Calendar} label="Ano" value={`${v.year}/${v.yearModel}`} />
            <SpecTile icon={Gauge} label="KM" value={`${num(v.km)} km`} />
            <SpecTile icon={Fuel} label="Combustível" value={v.fuel} />
            <SpecTile icon={Cog} label="Câmbio" value={v.transm} />
            <SpecTile icon={Palette} label="Cor" value={v.color} colorHex={v.colorHex} />
            <SpecTile icon={Car} label="Categoria" value={v.category} />
            <SpecTile icon={MapPin} label="Local" value={`${v.city} (${v.state})`} />
            <SpecTile icon={Tag} label="Final da placa" value={v.plate ? v.plate : "—"} />
          </div>
        </div>

        {v.optionals.length > 0 && (
          <div className="card dt-card">
            <span className="micro">Opcionais</span>
            <div className="dt-optionals">
              {v.optionals.map((o) => (
                <span key={o} className="dt-opt">
                  <Check size={14} />
                  {o}
                </span>
              ))}
            </div>
          </div>
        )}

        {v.obs && (
          <div className="card dt-card">
            <span className="micro">Observações</span>
            <p className="dt-obs">{v.obs}</p>
          </div>
        )}

        {/* Insights — premium */}
        <div className="card dt-card">
          <div className="ra-flex ra-between ra-center dt-insights-head">
            <span className="micro">Insights do anúncio</span>
            {v.premium ? (
              <Badge tone="success" icon={Check}>
                Liberado
              </Badge>
            ) : (
              <Badge tone="trending" icon={Crown}>
                Premium
              </Badge>
            )}
          </div>
          {v.premium && v.insights ? (
            <div className="dt-insights">
              <div className="dt-insight">
                <Eye size={18} />
                <div>
                  <div className="dt-insight-num">{num(v.insights.views)}</div>
                  <div className="dt-insight-label">Visualizações</div>
                </div>
              </div>
              <div className="dt-insight">
                <Zap size={18} />
                <div>
                  <div className="dt-insight-num">{Math.round(v.insights.rankingScore)}</div>
                  <div className="dt-insight-label">Radar Score</div>
                </div>
              </div>
              <div className="dt-insight dt-insight-soon">
                <Sparkles size={18} />
                <div>
                  <div className="dt-insight-num">Em breve</div>
                  <div className="dt-insight-label">Demanda e comportamento</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="dt-gate dt-gate-insights">
              <div className="dt-gate-blur">
                <div className="dt-insights">
                  <div className="dt-insight">
                    <Eye size={18} />
                    <div>
                      <div className="dt-insight-num">•••</div>
                      <div className="dt-insight-label">Visualizações</div>
                    </div>
                  </div>
                  <div className="dt-insight">
                    <Zap size={18} />
                    <div>
                      <div className="dt-insight-num">••</div>
                      <div className="dt-insight-label">Radar Score</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dt-gate-over">
                <div className="lock-c">
                  <Crown size={18} />
                </div>
                <div className="dt-gate-title">Insights são Premium</div>
                <div className="muted dt-gate-sub">
                  Demanda, ranking e comportamento deste anúncio.
                </div>
                <Button variant="primary" icon={Crown} onClick={goPlans}>
                  Desbloquear
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Similares */}
        {v.similar.length > 0 && (
          <div className="dt-similar">
            <div className="dt-similar-head">
              <Flame size={18} color="var(--trending)" />
              <h2 className="dt-similar-title">Outras oportunidades</h2>
            </div>
            <div className="dt-similar-row">
              {v.similar.map((s, idx) =>
                s.locked ? (
                  <button
                    key={idx}
                    className="dt-sim dt-sim-locked"
                    onClick={() => router.push("/app/planos")}
                  >
                    <div className="dt-sim-content">
                      <div className="dt-sim-img">
                        {s.coverPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.coverPhoto} alt="Veículo" />
                        ) : (
                          <Car size={30} strokeWidth={1.4} />
                        )}
                      </div>
                      <div className="dt-sim-body">
                        <div className="dt-sim-title">Volkswagen Nivus</div>
                        <div className="dt-sim-price">R$ •••.•••</div>
                        <div className="dt-sim-sub">•••• · •• km · ••••••</div>
                      </div>
                    </div>
                    <div className="dt-sim-over">
                      <div className="dt-sim-lock">
                        <Lock size={16} />
                      </div>
                      <span className="dt-sim-lock-cta">
                        <Crown size={12} />
                        Premium
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    key={s.id}
                    className="dt-sim"
                    onClick={() => router.push(`/app/catalogo/${s.id}`)}
                  >
                    <div className="dt-sim-img">
                      {s.coverPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.coverPhoto} alt={`${s.brand} ${s.model}`} />
                      ) : (
                        <Car size={30} strokeWidth={1.4} />
                      )}
                      {s.diff <= -15 && (
                        <div className="dt-sim-badge">
                          <Badge tone="trending">{s.diff}%</Badge>
                        </div>
                      )}
                    </div>
                    <div className="dt-sim-body">
                      <div className="dt-sim-title">
                        {s.brand} {s.model}
                      </div>
                      <div className="dt-sim-price">R$ {brl(s.price)}</div>
                      <div className="dt-sim-sub">
                        {s.year} · {num(s.km)} km · {s.city} - {s.state}
                      </div>
                    </div>
                    <ChevronRight size={16} className="dt-sim-chev" />
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Bloco de contato do vendedor — gated por premium (vendedor dentro do blur). */
function ContactBlock({
  v,
  onUpgrade,
  onStore,
}: {
  v: VehicleDetail;
  onUpgrade: () => void;
  onStore: () => void;
}) {
  return (
    <div className="dt-contact">
      <div className="ra-flex ra-between ra-center dt-contact-head">
        <span className="micro">Contato do vendedor</span>
        {v.premium ? (
          <Badge tone="success" icon={Check}>
            Liberado
          </Badge>
        ) : (
          <Badge tone="trending" icon={Crown}>
            Premium
          </Badge>
        )}
      </div>

      {v.premium && v.seller ? (
        <>
          <div className="dt-seller">
            <div className="dt-seller-av">
              {v.seller.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.seller.logoUrl} alt={v.seller.name} className="dt-seller-logo" />
              ) : (
                v.seller.initials || "—"
              )}
            </div>
            <div className="dt-seller-info">
              <div className="dt-seller-name">
                {v.seller.name}
                {v.seller.verified && <ShieldCheck size={14} color="var(--success)" />}
              </div>
              <div className="dt-seller-city">
                {v.seller.city} ({v.seller.state})
              </div>
            </div>
          </div>
          <div className="dt-contact-actions">
            <div className="dt-phone">
              <Phone size={16} />
              {maskPhone(v.seller.phone)}
            </div>
            {v.seller.whatsapp && (
              <a
                className="btn btn-wa dt-btn-block"
                href={`https://wa.me/${v.seller.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void leadsApi.contact(v.id, "whatsapp")}
              >
                <WhatsAppIcon size={17} />
                Chamar no WhatsApp
              </a>
            )}
            <button
              className="btn btn-tg dt-btn-block"
              onClick={() => void leadsApi.contact(v.id, "telegram")}
            >
              <TelegramIcon size={17} />
              Chamar no Telegram
            </button>
          </div>

          <div className="dt-store-rep">
            {v.seller.rating > 0 && (
              <div className="dt-rep-item">
                <div className="dt-rep-stars">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      size={14}
                      fill={idx < Math.round(v.seller!.rating) ? "var(--warning)" : "none"}
                      color="var(--warning)"
                    />
                  ))}
                </div>
                <div className="dt-rep-text">
                  <b>{v.seller.rating.toFixed(1)}</b>
                  <span className="muted">
                    {v.seller.reviews > 0
                      ? `${num(v.seller.reviews)} avaliações`
                      : "sem avaliações"}
                  </span>
                </div>
              </div>
            )}
            {v.seller.since > 0 && (
              <div className="dt-rep-item">
                <div className="dt-rep-icon">
                  <Calendar size={15} />
                </div>
                <div className="dt-rep-text">
                  <b>Desde {v.seller.since}</b>
                  <span className="muted">
                    {new Date().getFullYear() - v.seller.since} anos na plataforma
                  </span>
                </div>
              </div>
            )}
          </div>

          <button className="btn btn-secondary dt-btn-block dt-store-btn" onClick={onStore}>
            <Store size={16} />
            Ver todos os anúncios desta loja
          </button>

          <div className="dt-guarantees">
            {v.delivery && (
              <span className="dt-guarantee">
                <Truck size={14} />
                Entrega disponível
              </span>
            )}
            {v.seller.verified && (
              <span className="dt-guarantee">
                <ShieldCheck size={14} />
                Loja verificada
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="dt-gate dt-gate-contact">
          <div className="dt-gate-blur">
            <div className="dt-seller">
              <div className="dt-seller-av dt-seller-av-ph" />
              <div className="dt-seller-info">
                <div className="dt-ph-line" style={{ width: "62%" }} />
                <div className="dt-ph-line dt-ph-line-sm" style={{ width: "40%" }} />
              </div>
            </div>
            <div className="dt-phone">
              <Phone size={16} />
              (47) 9••••-••••
            </div>
            <div className="dt-ph-btn" />
          </div>
          <div className="dt-gate-over">
            <div className="lock-c">
              <Crown size={18} />
            </div>
            <div className="dt-gate-title">Contato é Premium</div>
            <div className="muted dt-gate-sub">
              Vendedor, telefone e WhatsApp ficam visíveis no plano Premium.
            </div>
            <Button variant="primary" icon={Crown} onClick={onUpgrade}>
              Desbloquear
            </Button>
          </div>
          <div className="dt-contact-note muted">
            <ShieldCheck size={14} />
            No produto real, o backend não envia este dado para usuários FREE — o blur é apenas UX.
          </div>
        </div>
      )}
    </div>
  );
}

interface SpecTileProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: React.ReactNode;
  colorHex?: string | null;
}

function SpecTile({ icon: Icon, label, value, colorHex }: SpecTileProps) {
  return (
    <div className="dt-spec">
      <div className="dt-spec-icon">
        <Icon size={18} />
      </div>
      <div className="dt-spec-label">{label}</div>
      <div className="dt-spec-value">
        {colorHex && <span className="dt-spec-swatch" style={{ background: colorHex }} />}
        {value}
      </div>
    </div>
  );
}

/** Formata telefone BR: 4732341270 -> (47) 3234-1270 / 47999998888 -> (47) 99999-8888. */
function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}
