/**
 * RadarAuto — App Consolidado (Fase 1 / Slice 4)
 *
 * Propósito:
 *   Une os protótipos numa experiência navegável única: App Shell +
 *   Marketplace + Detalhe do veículo, com roteamento por estado e estado
 *   global compartilhado (plano FREE/Premium, favoritos, analytics).
 *
 * Fluxo principal:
 *   Catálogo → clique no card → Detalhe (mesma janela) → Voltar.
 *   Favoritar no catálogo reflete no detalhe e vice-versa.
 *   O toggle de plano (demo) controla o paywall em qualquer veículo.
 *
 * Regras importantes (master prompt):
 *   - Ordenação default = Radar Score (ranking), nunca created_at.
 *   - Blur é apenas UX; no produto real o backend não envia dado premium.
 *   - Toda interação relevante gera evento de analytics.
 *
 * Impacto arquitetural:
 *   No repo real isto vira o app shell + modules/{vehicles,analytics,
 *   subscriptions} sobre modules/shared. Roteamento aqui é mock (useState);
 *   em produção: Next App Router + TanStack Query.
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Car,
  Flame,
  BarChart3,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  Bell,
  Search,
  Menu,
  X,
  Star,
  MapPin,
  Gauge,
  Fuel,
  Calendar,
  Palette,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ArrowLeft,
  Lock,
  Crown,
  Zap,
  Phone,
  Check,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Maximize2,
  MessageCircle,
  Send,
  Activity,
  ZoomIn,
  ZoomOut,
  Upload,
  Share2,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
  Tag,
  Cog,
  ExternalLink,
  SlidersHorizontal,
  LayoutGrid,
  RotateCcw,
  ArrowDownWideNarrow,
  DollarSign,
  Truck,
  Package,
  Plus,
  Pencil,
  Trash2,
  Clock,
  MousePointerClick,
  Flag,
  User,
  LogOut,
} from "lucide-react";

/* ============================== TOKENS ============================== */
const TOKENS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
:root{
  --bg:#F6F8FB; --bg-2:#EEF2F7; --card:#FFFFFF; --border:#E2E8F0;
  --text:#0F172A; --muted:#64748B;
  --primary:#2563EB; --primary-h:#1D4ED8;
  --success:#10B981; --warning:#F59E0B; --danger:#EF4444; --trending:#FF6B00;
  --primary-t:rgba(37,99,235,.10); --success-t:rgba(16,185,129,.12);
  --warning-t:rgba(245,158,11,.14); --danger-t:rgba(239,68,68,.10);
  --trending-t:rgba(255,107,0,.12); --muted-t:rgba(100,116,139,.10);
  --r-sm:12px; --r:16px; --r-lg:20px; --r-xl:24px; --r-full:999px;
  --sh-sm:0 1px 2px rgba(15,23,42,.04),0 1px 3px rgba(15,23,42,.03);
  --sh:0 4px 18px rgba(15,23,42,.05),0 1px 4px rgba(15,23,42,.03);
  --sh-lg:0 16px 40px rgba(15,23,42,.09);
  --font:'Plus Jakarta Sans',-apple-system,system-ui,sans-serif;
  --display:'Sora',var(--font);
}
*{box-sizing:border-box;}
.ra-root{font-family:var(--font);color:var(--text);background:var(--bg);-webkit-font-smoothing:antialiased;min-height:100vh;}
.ra-root ::selection{background:var(--primary-t);}
.ra-flex{display:flex;} .ra-center{align-items:center;} .ra-between{justify-content:space-between;} .ra-wrap{flex-wrap:wrap;}
.display{font-family:var(--display);letter-spacing:-.02em;}
.micro{font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);}
.muted{color:var(--muted);}
.num{font-family:var(--display);font-variant-numeric:tabular-nums;letter-spacing:-.03em;font-weight:700;}

.sb{position:fixed;inset:0 auto 0 0;width:264px;background:var(--card);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:0;z-index:50;transition:transform .28s cubic-bezier(.4,0,.2,1);overflow:hidden;}
.sb-logo{display:flex;align-items:center;gap:11px;padding:22px 20px;cursor:pointer;background:linear-gradient(135deg,var(--primary),#3b82f6 70%,#60a5fa);position:relative;overflow:hidden;}
.sb-logo::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 90% 30%, rgba(255,255,255,.15), transparent 60%);pointer-events:none;}
.sb-mark{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#fff;color:var(--primary);box-shadow:0 4px 12px rgba(0,0,0,.12);position:relative;z-index:1;}
.sb-name{font-family:var(--display);font-weight:700;font-size:19px;letter-spacing:-.02em;color:#fff;position:relative;z-index:1;}
.sb-name b{color:#fff;}
.sb-sec{padding:6px 10px;margin-top:14px;}
.sb-body{padding:6px 16px 0;display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;}
.nav-i.active{background:linear-gradient(95deg,var(--primary-t),rgba(37,99,235,.06));color:var(--primary);font-weight:600;}
.sb-user{margin:0 16px 18px;display:flex;align-items:center;gap:11px;padding:12px;border-radius:14px;background:var(--bg-2);}
.nav-i{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:13px;color:var(--muted);font-weight:500;font-size:14.5px;cursor:pointer;border:none;background:transparent;width:100%;text-align:left;transition:all .18s ease;position:relative;}
.nav-i:hover{background:var(--bg-2);color:var(--text);}
.nav-i.active{background:var(--primary-t);color:var(--primary);font-weight:600;}
.nav-i.active::before{content:"";position:absolute;left:-16px;top:50%;transform:translateY(-50%);width:4px;height:20px;border-radius:0 4px 4px 0;background:var(--primary);}
.nav-i .chev{margin-left:auto;opacity:0;transition:opacity .18s;}
.nav-i.active .chev{opacity:1;}
.sb-user{margin-top:auto;display:flex;align-items:center;gap:11px;padding:12px;border-radius:14px;background:var(--bg-2);}
.av{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;font-family:var(--display);font-weight:700;font-size:14px;color:#fff;background:linear-gradient(135deg,#0F172A,#334155);}
.dot{width:7px;height:7px;border-radius:50%;background:var(--success);animation:pulse 2s infinite;}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.45);}70%{box-shadow:0 0 0 6px rgba(16,185,129,0);}100%{box-shadow:0 0 0 0 rgba(16,185,129,0);}}

.main{margin-left:264px;min-height:100vh;}
.top{position:sticky;top:0;z-index:40;background:var(--primary);border-bottom:1px solid var(--primary-hover);padding:16px 32px;display:flex;align-items:center;gap:14px;box-shadow:0 2px 12px rgba(37,99,235,.15);}
.top .display{color:#fff;}
.top .muted{color:rgba(255,255,255,.72);}
.top .micro{color:rgba(255,255,255,.7);}
.top .icon-btn{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.18);color:#fff;}
.top .icon-btn:hover{background:rgba(255,255,255,.22);color:#fff;border-color:rgba(255,255,255,.3);}
.top .btn-ghost{color:#fff;background:rgba(255,255,255,.1);}
.top .btn-ghost:hover{background:rgba(255,255,255,.22);color:#fff;}
.top .search .inp{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.18);color:#fff;}
.top .search .inp::placeholder{color:rgba(255,255,255,.65);}
.top .search .inp:focus{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.4);}
.top .search>svg{color:rgba(255,255,255,.75);}
.top .seg{background:rgba(255,255,255,.12);}
.top .seg button{color:rgba(255,255,255,.75);}
.top .seg button.on{background:#fff;color:var(--primary);}
.top .seg button.on.prem{color:var(--trending);}
.top h1{font-family:var(--display);font-size:23px;font-weight:700;letter-spacing:-.02em;}
.icon-btn{width:42px;height:42px;border-radius:12px;border:1px solid var(--border);background:var(--card);display:grid;place-items:center;cursor:pointer;color:var(--muted);transition:all .18s;position:relative;flex-shrink:0;}
.icon-btn:hover{color:var(--text);border-color:#cbd5e1;}
.badge-dot{position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:50%;background:var(--trending);border:2px solid var(--card);}
.notif-wrap{position:relative;}
.notif-pop{position:absolute;top:calc(100% + 10px);right:0;width:360px;max-width:calc(100vw - 32px);background:var(--card);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh-lg);z-index:60;overflow:hidden;animation:notif-in .22s cubic-bezier(.34,1.3,.64,1);}
@keyframes notif-in{from{opacity:0;transform:translateY(-8px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
.notif-head{padding:14px 18px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px;}
.notif-body{max-height:480px;overflow-y:auto;}
.notif-item{display:flex;gap:12px;padding:14px 18px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .15s;text-align:left;width:100%;background:transparent;border-left:none;border-right:none;border-top:none;}
.notif-item:hover{background:var(--bg-2);}
.notif-item:last-child{border-bottom:none;}
.notif-item .ni-row{display:flex;align-items:center;gap:8px;}
.notif-item .ni-title{font-weight:600;font-size:13.5px;color:var(--text);line-height:1.35;flex:1;}
.notif-item .ni-dot{width:7px;height:7px;border-radius:50%;background:var(--primary);flex-shrink:0;}
.notif-item .ni-text{font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.45;}
.notif-item .ni-time{font-size:11px;color:var(--muted);margin-top:5px;}
.notif-icon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex-shrink:0;}
.notif-empty{padding:48px 22px;text-align:center;color:var(--muted);display:flex;flex-direction:column;align-items:center;gap:10px;}
.usr-wrap{position:relative;}
.usr-btn{display:flex;align-items:center;gap:8px;padding:5px 10px 5px 5px;border-radius:30px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);cursor:pointer;transition:all .15s;}
.usr-btn:hover{background:rgba(255,255,255,.22);}
.usr-btn .av{width:30px;height:30px;border-radius:50%;font-size:11px;}
.usr-btn .usr-name{color:#fff;font-weight:600;font-size:13px;}
.usr-pop{position:absolute;top:calc(100% + 10px);right:0;width:240px;background:var(--card);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh-lg);z-index:60;overflow:hidden;animation:notif-in .22s cubic-bezier(.34,1.3,.64,1);}
.usr-pop-head{padding:16px 16px 14px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:center;}
.usr-pop-head .av{width:42px;height:42px;border-radius:12px;font-size:14px;}
.usr-pop-item{display:flex;align-items:center;gap:10px;width:100%;padding:11px 16px;background:transparent;border:none;cursor:pointer;font-size:13.5px;color:var(--text);text-align:left;transition:background .12s;}
.usr-pop-item:hover{background:var(--bg-2);}
.usr-pop-item.danger{color:var(--danger);border-top:1px solid var(--border);}
.content{padding:26px 32px 90px;max-width:1320px;}
.top-search{width:260px;}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--font);font-weight:600;font-size:14px;border-radius:13px;border:1px solid transparent;cursor:pointer;transition:all .18s ease;white-space:nowrap;padding:12px 18px;line-height:1;}
.btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}
.btn:disabled:hover{transform:none;filter:none;box-shadow:none;}
.btn:active{transform:scale(.97);}
.btn-primary{background:var(--primary);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,.28);}
.btn-primary:hover{background:var(--primary-h);}
.btn-secondary{background:var(--card);color:var(--text);border-color:var(--border);}
.btn-secondary:hover{border-color:#cbd5e1;background:var(--bg-2);}
.btn-ghost{background:transparent;color:var(--muted);}
.btn-ghost:hover{background:var(--bg-2);color:var(--text);}
.btn-trending{background:var(--trending);color:#fff;box-shadow:0 4px 14px rgba(255,107,0,.3);}
.btn-trending:hover{filter:brightness(1.05);}
.btn-wa{background:#25D366;color:#fff;box-shadow:0 4px 14px rgba(37,211,102,.3);}
.btn-wa:hover{filter:brightness(1.04);}
.btn-block{width:100%;} .btn-sm{padding:8px 13px;font-size:13px;border-radius:11px;}
.spin{animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

.bdg{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:var(--r-full);font-size:12px;font-weight:600;line-height:1;}

.card{background:var(--card);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--sh-sm);}
.card-p{padding:22px;}

.lbl{font-size:12.5px;font-weight:600;color:var(--text);margin-bottom:7px;display:block;}
.inp{width:100%;padding:11px 13px;border-radius:12px;border:1px solid var(--border);background:var(--card);font-family:var(--font);font-size:13.5px;color:var(--text);transition:all .18s;outline:none;}
.inp::placeholder{color:#94a3b8;}
.inp:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-t);}
select.inp{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:34px;}
.search{position:relative;}
.search .inp{padding-left:40px;}
.search>svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#94a3b8;}
.tg{width:42px;height:25px;border-radius:var(--r-full);background:var(--border);position:relative;cursor:pointer;transition:background .2s;border:none;flex-shrink:0;}
.tg.on{background:var(--primary);}
.tg span{position:absolute;top:3px;left:3px;width:19px;height:19px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.tg.on span{transform:translateX(17px);}

.seg{display:inline-flex;background:var(--bg-2);border-radius:11px;padding:3px;gap:2px;}
.seg button{padding:7px 13px;border-radius:8px;border:none;background:transparent;font-weight:600;font-size:13px;cursor:pointer;color:var(--muted);transition:all .15s;display:inline-flex;align-items:center;gap:6px;}
.seg button.on{background:var(--card);color:var(--text);box-shadow:var(--sh-sm);}
.seg button.on.prem{color:var(--trending);}

.mk{display:flex;gap:24px;align-items:flex-start;}
.rail{width:266px;flex-shrink:0;position:sticky;top:96px;}
.rail-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px;box-shadow:var(--sh-sm);}
.fgroup{padding:16px 0;border-bottom:1px solid var(--border);}
.fgroup:first-of-type{padding-top:0;}
.fgroup:last-of-type{border-bottom:none;padding-bottom:0;}
.mkmain{flex:1;min-width:0;}

.toolbar{display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
.dd{position:relative;}
.dd-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 14px;border-radius:12px;border:1px solid var(--border);background:var(--card);font-weight:600;font-size:13.5px;cursor:pointer;color:var(--text);transition:all .18s;}
.dd-btn:hover{border-color:#cbd5e1;}
.dd-menu{position:absolute;top:calc(100% + 8px);right:0;z-index:30;background:var(--card);border:1px solid var(--border);border-radius:14px;box-shadow:var(--sh-lg);padding:6px;min-width:240px;animation:pop .18s ease;}
@keyframes pop{from{opacity:0;transform:translateY(-6px);}}
.dd-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;font-size:13.5px;font-weight:500;cursor:pointer;color:var(--text);transition:background .15s;}
.dd-item:hover{background:var(--bg-2);}
.dd-item.on{background:var(--primary-t);color:var(--primary);font-weight:600;}
.vtoggle{display:flex;background:var(--bg-2);border-radius:12px;padding:3px;gap:2px;}
.vtoggle button{width:36px;height:34px;border-radius:9px;border:none;background:transparent;display:grid;place-items:center;cursor:pointer;color:var(--muted);transition:all .15s;}
.vtoggle button.on{background:var(--card);color:var(--primary);box-shadow:var(--sh-sm);}
.fab{display:none;}

.achip{display:inline-flex;align-items:center;gap:6px;padding:6px 8px 6px 12px;border-radius:var(--r-full);background:var(--primary-t);color:var(--primary);font-size:12.5px;font-weight:600;}
.achip button{border:none;background:rgba(37,99,235,.15);width:18px;height:18px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--primary);}

.vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(264px,1fr));gap:20px;}
.pgn{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:32px;flex-wrap:wrap;}
.pgn-info{font-size:13px;color:var(--muted);}
.pgn-info b{color:var(--text);font-weight:600;}
.pgn-ctrl{display:flex;align-items:center;gap:6px;}
.pgn-btn{min-width:38px;height:38px;padding:0 10px;border-radius:10px;border:1px solid var(--border);background:var(--card);color:var(--text);font-weight:600;font-size:13.5px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;}
.pgn-btn:hover:not(:disabled){border-color:var(--primary);color:var(--primary);}
.pgn-btn.on{background:var(--primary);color:#fff;border-color:var(--primary);box-shadow:0 4px 12px var(--primary-t);}
.pgn-btn:disabled{opacity:.4;cursor:not-allowed;}
.pgn-dots{padding:0 4px;color:var(--muted);user-select:none;}
.pgn-per{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);}
.pgn-per select{padding:7px 28px 7px 11px;border:1px solid var(--border);border-radius:9px;background:var(--card);font-size:13px;font-weight:600;color:var(--text);cursor:pointer;}
.vcard{background:var(--card);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;box-shadow:var(--sh-sm);transition:all .22s;cursor:pointer;}
.vcard:hover{box-shadow:var(--sh);transform:translateY(-3px);border-color:#dbe3ee;}
.vimg{height:200px;position:relative;background-color:#cbd5e1;background-image:linear-gradient(135deg,#e2e8f0,#cbd5e1);background-size:cover;background-position:center;display:grid;place-items:center;color:#94a3b8;}
.ov-tl{position:absolute;top:11px;left:11px;} .ov-tr{position:absolute;top:11px;right:11px;}
.ov-br{position:absolute;bottom:11px;right:11px;}
.ov-bl{position:absolute;bottom:11px;left:11px;}
.delivchip{padding:4px 9px;border-radius:var(--r-full);background:rgba(255,255,255,.92);color:var(--success);font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:4px;backdrop-filter:blur(4px);box-shadow:var(--sh-sm);}
.fav{width:33px;height:33px;border-radius:10px;background:rgba(255,255,255,.92);backdrop-filter:blur(4px);display:grid;place-items:center;cursor:pointer;border:none;transition:all .18s;}
.fav:hover{transform:scale(1.1);}
.imgcount{padding:4px 9px;border-radius:var(--r-full);background:rgba(15,23,42,.6);color:#fff;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px;backdrop-filter:blur(4px);}
.spec{display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--muted);font-weight:500;}
.score{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:var(--r-full);font-size:12px;font-weight:700;font-family:var(--display);}
.lcard{display:flex;align-items:stretch;}
.lcard .vimg{width:280px;height:auto;min-height:210px;flex-shrink:0;}
.lcard>div:last-child{flex:1;display:flex;flex-direction:column;justify-content:center;}

.sk{background:linear-gradient(90deg,#eef2f7 25%,#e2e8f0 37%,#eef2f7 63%);background-size:400% 100%;animation:sh 1.4s ease infinite;border-radius:8px;}
@keyframes sh{0%{background-position:100% 0;}100%{background-position:-100% 0;}}

.opp{background:linear-gradient(120deg,rgba(255,107,0,.07),rgba(255,107,0,.02));border:1px solid rgba(255,107,0,.18);border-radius:var(--r-xl);padding:20px;margin-bottom:24px;}
.opp-row{display:flex;gap:14px;overflow-x:auto;padding-bottom:4px;}
.opp-mini{flex:0 0 200px;background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px;cursor:pointer;transition:all .2s;}
.opp-mini:hover{box-shadow:var(--sh);transform:translateY(-2px);}

.empty{background:var(--card);border:1px dashed var(--border);border-radius:var(--r-xl);padding:64px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px;}

.gal-main{position:relative;border-radius:var(--r-lg);overflow:hidden;aspect-ratio:4/3;width:100%;max-height:520px;background-color:#cbd5e1;background-image:linear-gradient(135deg,#e2e8f0,#cbd5e1);background-size:cover;background-position:center;display:grid;place-items:center;color:#94a3b8;cursor:zoom-in;}
.gal-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.92);border:none;display:grid;place-items:center;cursor:pointer;box-shadow:var(--sh);color:var(--text);transition:all .15s;z-index:2;}
.gal-arrow:hover{transform:translateY(-50%) scale(1.08);}
.gal-arrow.l{left:14px;} .gal-arrow.r{right:14px;}
.gal-count{position:absolute;bottom:14px;right:14px;padding:5px 11px;border-radius:var(--r-full);background:rgba(15,23,42,.6);color:#fff;font-size:12px;font-weight:600;backdrop-filter:blur(4px);display:inline-flex;gap:6px;align-items:center;z-index:2;}
.gal-lockover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:linear-gradient(180deg,rgba(255,255,255,.45),rgba(255,255,255,.8));backdrop-filter:blur(2px);cursor:default;}
.gal-thumbs{display:flex;gap:10px;margin-top:12px;overflow-x:auto;padding-bottom:4px;}
.thumb{flex:0 0 96px;aspect-ratio:4/3;height:auto;border-radius:12px;overflow:hidden;cursor:pointer;border:2px solid transparent;background-color:#cbd5e1;background-image:linear-gradient(135deg,#e2e8f0,#cbd5e1);background-size:cover;background-position:center;display:grid;place-items:center;color:#94a3b8;position:relative;transition:all .15s;}
.thumb.on{border-color:var(--primary);}
.thumb-lock{position:absolute;inset:0;background:rgba(15,23,42,.55);display:grid;place-items:center;color:#fff;}

.specs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
.spec-tile{background:var(--bg-2);border-radius:14px;padding:14px 15px;display:flex;flex-direction:column;gap:8px;}
.spec-tile .ic{color:var(--primary);}
.spec-tile .lab{font-size:11.5px;color:var(--muted);font-weight:600;}
.spec-tile .val{font-weight:700;font-size:15px;font-family:var(--display);}
.opts{display:flex;flex-wrap:wrap;gap:9px;}
.opt{display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border-radius:11px;background:var(--bg-2);font-size:13px;font-weight:500;}
.opt .ck{color:var(--success);}

.dt{display:grid;grid-template-columns:1fr 340px;gap:18px;align-items:stretch;grid-template-areas:"top side" "rest rest";}
.dt-top{grid-area:top;min-width:0;display:flex;flex-direction:column;gap:12px;}
.dt-rest{grid-area:rest;min-width:0;}
.dt-side{grid-area:side;}

.gate{position:relative;border-radius:var(--r);overflow:hidden;}
.gate-blur{filter:blur(8px);pointer-events:none;user-select:none;}
.gate-over{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;text-align:center;padding:16px;background:linear-gradient(180deg,rgba(255,255,255,.62),rgba(255,255,255,.9));}
.lock-c{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:var(--trending-t);color:var(--trending);flex-shrink:0;}
.irow{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);}
.irow:last-child{border-bottom:none;}
.sim-row{display:flex;gap:14px;overflow-x:auto;padding-bottom:4px;}
.sim{flex:0 0 210px;background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;cursor:pointer;transition:all .2s;}
.sim:hover{box-shadow:var(--sh);transform:translateY(-2px);}
.sim-img{height:108px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);display:grid;place-items:center;color:#94a3b8;position:relative;}

.afab{position:fixed;bottom:22px;right:22px;z-index:75;height:48px;padding:0 18px;border-radius:999px;background:var(--text);color:#fff;border:none;display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:13.5px;cursor:pointer;box-shadow:var(--sh-lg);transition:transform .15s;}
.afab:hover{transform:translateY(-2px);}
.afab .cnt{background:var(--trending);border-radius:999px;font-size:11px;padding:1px 7px;}
.tfab{position:fixed;bottom:22px;left:22px;z-index:75;width:48px;height:48px;border-radius:50%;background:var(--card);border:1px solid var(--border);display:grid;place-items:center;cursor:pointer;box-shadow:var(--sh-lg);transition:transform .15s;color:var(--primary);}
.tfab:hover{transform:translateY(-2px) rotate(45deg);}
.tpop{position:fixed;bottom:80px;left:22px;z-index:75;width:260px;background:var(--card);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh-lg);padding:16px;animation:notif-in .22s cubic-bezier(.34,1.3,.64,1);}
.tpop-head{font-weight:700;font-size:14px;margin-bottom:4px;display:flex;align-items:center;gap:8px;}
.tpop-sub{font-size:12px;color:var(--muted);margin-bottom:14px;line-height:1.4;}
.tgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.tswatch{aspect-ratio:1;border-radius:12px;border:3px solid transparent;cursor:pointer;display:grid;place-items:center;color:#fff;font-weight:700;font-size:11px;transition:all .15s;position:relative;}
.tswatch:hover{transform:scale(1.06);}
.tswatch.on{border-color:var(--text);}
.tswatch.on::after{content:"";position:absolute;inset:-7px;border:2px solid var(--text);border-radius:16px;}
.apanel{position:fixed;bottom:82px;right:22px;z-index:75;width:344px;max-height:62vh;background:var(--card);border:1px solid var(--border);border-radius:18px;box-shadow:var(--sh-lg);display:flex;flex-direction:column;overflow:hidden;animation:pop .2s ease;}
.ahead{padding:15px 17px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.alist{overflow-y:auto;}
.aev{padding:11px 16px;border-bottom:1px solid var(--border);animation:slidein .25s ease;}
.aev:first-child{background:var(--bg-2);}
@keyframes slidein{from{opacity:0;transform:translateX(10px);}}
.aev .nm{font-family:var(--display);font-weight:600;font-size:13px;display:flex;align-items:center;gap:7px;}
.aev .pl{font-size:11.5px;color:var(--muted);margin-top:3px;font-variant-numeric:tabular-nums;word-break:break-all;}

.lb{position:fixed;inset:0;background:rgba(15,23,42,.92);z-index:95;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;animation:fade .2s;}
@keyframes fade{from{opacity:0;}}
.lb-img{width:min(940px,92vw);height:min(580px,70vh);border-radius:16px;background:linear-gradient(135deg,#475569,#334155);display:grid;place-items:center;color:#cbd5e1;position:relative;}
.lb-close{position:absolute;top:20px;right:20px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);border:none;color:#fff;display:grid;place-items:center;cursor:pointer;}

.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;max-width:780px;}
.plans3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:980px;align-items:start;}
.incl{display:grid;grid-template-columns:1fr 1fr;gap:11px 24px;}
.pricing-row{display:flex;gap:22px;justify-content:center;align-items:center;flex-wrap:wrap;padding-top:18px;max-width:1000px;}
.pc{flex:1 1 0;min-width:262px;max-width:300px;background:var(--card);border:1px solid var(--border);border-radius:22px;box-shadow:var(--sh);overflow:hidden;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s;}
.pc-hl{transform:scale(1.06);box-shadow:var(--sh-lg);z-index:3;border-color:transparent;}
.pc-head{position:relative;height:104px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.pc-hl .pc-head{height:122px;}
.pc-wave{position:absolute;width:175%;height:200%;left:-37%;top:-92%;background:rgba(255,255,255,.13);border-radius:46%;}
.pc-pop{position:absolute;top:14px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.22);color:#fff;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 11px;border-radius:999px;z-index:1;backdrop-filter:blur(4px);white-space:nowrap;}
.pc-name{position:relative;color:#fff;font-family:var(--display);font-weight:700;font-size:21px;letter-spacing:.02em;text-transform:uppercase;z-index:1;}
.pc-body{background:var(--card);margin-top:-22px;border-radius:24px 24px 22px 22px;position:relative;z-index:2;padding:22px 20px;display:flex;flex-direction:column;align-items:center;gap:11px;flex:1;}
.pc-price{font-family:var(--display);font-weight:700;font-size:38px;letter-spacing:-.03em;line-height:1;color:var(--text);}
.pc-price small{font-size:14px;color:var(--muted);font-weight:600;margin-left:4px;}
.pc-underline{width:46px;height:4px;border-radius:4px;}
.pc-note{font-size:12px;color:var(--muted);text-align:center;}
.pc-feats{width:100%;display:flex;flex-direction:column;gap:10px;margin:6px 0 2px;}
.pc-feat{display:flex;align-items:center;gap:9px;font-size:13px;line-height:1.3;}
.pc-feat .ck{color:var(--success);flex-shrink:0;}
.pc-btn{width:100%;margin-top:auto;text-transform:uppercase;letter-spacing:.04em;font-weight:700;font-size:13px;border:none;box-shadow:var(--sh-sm);}
.pc-btn:hover:not(:disabled){filter:brightness(1.07);}
.opp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}
.ostat{background:var(--card);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;box-shadow:var(--sh-sm);display:flex;align-items:center;gap:13px;}
.ostat .ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex-shrink:0;}
.ohero{background:linear-gradient(120deg,rgba(255,107,0,.10),rgba(255,107,0,.02));border:1px solid rgba(255,107,0,.22);border-radius:var(--r-xl);padding:22px;margin-bottom:24px;display:flex;gap:22px;align-items:center;flex-wrap:wrap;}
.ohero-img{width:210px;height:148px;border-radius:var(--r);background:linear-gradient(135deg,#e2e8f0,#cbd5e1);display:grid;place-items:center;color:#94a3b8;flex-shrink:0;position:relative;}
.opp-list{display:flex;flex-direction:column;gap:12px;}
.oitem{background:var(--card);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--sh-sm);padding:15px 18px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all .18s;flex-wrap:wrap;}
.oitem:hover{box-shadow:var(--sh);transform:translateY(-2px);border-color:#dbe3ee;}
.orank{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-family:var(--display);font-weight:700;font-size:14px;background:var(--bg-2);color:var(--muted);flex-shrink:0;}
.orank.top{background:var(--trending-t);color:var(--trending);}
.obar{height:7px;border-radius:5px;background:var(--bg-2);overflow:hidden;margin-top:9px;max-width:260px;}
.obar span{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#FF8A3D,#FF6B00);}
.opct{text-align:right;flex-shrink:0;}
.opct .big{font-family:var(--display);font-weight:700;font-size:22px;letter-spacing:-.02em;color:var(--trending);}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px;}
.fgrid .full{grid-column:1 / -1;}
.optsel{display:flex;flex-wrap:wrap;gap:9px;}
.optsel button{display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border-radius:11px;border:1px solid var(--border);background:var(--card);font-size:13px;font-weight:500;cursor:pointer;color:var(--muted);transition:all .15s;}
.optsel button.on{background:var(--primary-t);border-color:var(--primary);color:var(--primary);}
.photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:12px;}
.phototile{height:80px;border-radius:13px;border:1px solid var(--border);background:var(--bg-2);display:grid;place-items:center;color:#94a3b8;}
.photoadd{height:80px;border-radius:13px;border:1.5px dashed #cbd5e1;background:transparent;display:grid;place-items:center;color:var(--muted);cursor:pointer;transition:all .15s;}
.photoadd:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-t);}
.minv-thumb{width:84px;height:62px;border-radius:12px;background-color:#cbd5e1;background-image:linear-gradient(135deg,#e2e8f0,#cbd5e1);background-size:cover;background-position:center;display:grid;place-items:center;color:#94a3b8;flex-shrink:0;position:relative;}
.iconbtn-sm{width:36px;height:36px;border-radius:10px;border:1px solid var(--border);background:var(--card);display:grid;place-items:center;cursor:pointer;color:var(--muted);transition:all .15s;flex-shrink:0;}
.iconbtn-sm:hover{color:var(--text);border-color:#cbd5e1;}
.iconbtn-sm.danger:hover{color:var(--danger);border-color:var(--danger);}
.cd-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:var(--r-full);background:var(--bg-2);font-size:12.5px;}
.lead-av{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-family:var(--display);font-weight:700;font-size:14px;flex-shrink:0;}
.wz-steps{display:flex;gap:8px;flex-wrap:wrap;}
.wz-step{display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:var(--r-full);font-size:12.5px;font-weight:600;color:var(--muted);background:var(--bg-2);transition:all .2s;}
.wz-step.on{background:var(--primary);color:#fff;}
.wz-step.done{background:var(--success-t);color:var(--success);}
.wz-num{width:19px;height:19px;border-radius:50%;display:grid;place-items:center;font-size:10.5px;background:rgba(255,255,255,.28);}
.wz-step.done .wz-num{background:var(--success);color:#fff;}
.wz-bar{height:6px;border-radius:4px;background:var(--bg-2);overflow:hidden;margin:16px 0 22px;}
.wz-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--primary),#3b82f6);border-radius:4px;transition:width .4s cubic-bezier(.4,0,.2,1);}
.choicegrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(116px,1fr));gap:12px;}
.choice{padding:18px 12px;border-radius:14px;border:1px solid var(--border);background:var(--card);font-size:14px;font-weight:600;cursor:pointer;transition:all .15s;text-align:center;color:var(--text);}
.choice:hover{border-color:#cbd5e1;transform:translateY(-2px);}
.choice.on{border-color:var(--primary);background:var(--primary-t);color:var(--primary);box-shadow:0 0 0 3px var(--primary-t);}
.step-anim{animation:stepIn .32s cubic-bezier(.4,0,.2,1);}
@keyframes stepIn{from{opacity:0;transform:translateX(14px);}to{opacity:1;transform:translateX(0);}}
.cbx-pop{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--card);border:1px solid var(--border);border-radius:13px;box-shadow:var(--sh-lg);z-index:30;max-height:240px;overflow-y:auto;padding:6px;}
.cbx-opt{display:flex;align-items:center;justify-content:space-between;width:100%;text-align:left;padding:9px 11px;border-radius:9px;background:transparent;border:none;cursor:pointer;font-size:13.5px;color:var(--text);}
.cbx-opt:hover{background:var(--bg-2);}
.cbx-opt.on{color:var(--primary);font-weight:600;background:var(--primary-t);}
.cbx-empty{padding:11px;font-size:13px;color:var(--muted);text-align:center;}
.wz-track{position:relative;height:30px;margin:16px 0 24px;display:flex;align-items:center;}
.wz-line{position:absolute;left:2px;right:2px;height:6px;border-radius:4px;background:var(--bg-2);}
.wz-line span{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,var(--primary),#3b82f6);transition:width .45s cubic-bezier(.4,0,.2,1);}
.wz-car{position:absolute;transform:translateX(-50%);transition:left .45s cubic-bezier(.4,0,.2,1);background:var(--card);border-radius:50%;padding:4px;color:var(--primary);display:grid;place-items:center;box-shadow:var(--sh);z-index:2;}
.wz-car.success{color:var(--success);}
.wz-flag{position:absolute;right:-4px;color:var(--muted);background:var(--card);border-radius:50%;padding:4px;display:grid;place-items:center;z-index:1;transition:color .3s;}
.wz-flag.done{color:var(--success);box-shadow:0 0 0 3px var(--success-t);}
.fipe-box{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 20px;border-radius:var(--r-lg);background:linear-gradient(120deg,var(--primary-t),transparent);border:1px solid rgba(37,99,235,.22);flex-wrap:wrap;}
.fipe-box .v{font-family:var(--display);font-weight:700;font-size:30px;letter-spacing:-.02em;color:var(--primary);line-height:1;}
.rec-box{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 20px;border-radius:var(--r-lg);background:linear-gradient(120deg,var(--trending-t),transparent);border:1px solid rgba(255,107,0,.28);flex-wrap:wrap;margin-top:14px;}
.rec-box .v{font-family:var(--display);font-weight:700;font-size:28px;letter-spacing:-.02em;color:var(--trending);line-height:1;}
.plan{background:var(--card);border:1px solid var(--border);border-radius:var(--r-xl);padding:28px;display:flex;flex-direction:column;gap:18px;position:relative;transition:all .2s;}
.plan.hl{border:2px solid var(--primary);box-shadow:0 14px 40px rgba(37,99,235,.13);}
.plan-badge{position:absolute;top:-13px;left:28px;}
.feat{display:flex;align-items:flex-start;gap:10px;font-size:13.5px;line-height:1.4;}
.feat .yes{color:var(--success);flex-shrink:0;margin-top:1px;}
.feat .no{color:#cbd5e1;flex-shrink:0;margin-top:1px;}
.feat.off{color:var(--muted);}
.save-bdg{display:inline-flex;align-items:center;padding:2px 7px;border-radius:var(--r-full);background:var(--success-t);color:var(--success);font-size:10.5px;font-weight:700;margin-left:6px;}
.cardbox{border:1px solid var(--border);border-radius:13px;padding:13px 15px;background:var(--bg-2);display:flex;align-items:center;gap:10px;font-variant-numeric:tabular-nums;color:var(--muted);font-size:14px;font-weight:600;}
.ov{position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(3px);z-index:100;display:grid;place-items:center;padding:20px;animation:fade .2s ease;}
.modal{background:var(--card);border-radius:var(--r-xl);box-shadow:var(--sh-lg);width:100%;max-width:460px;padding:28px;animation:mpop .26s cubic-bezier(.4,0,.2,1);max-height:90vh;overflow-y:auto;}
@keyframes mpop{from{opacity:0;transform:translateY(14px) scale(.97);}}
.sumrow{display:flex;justify-content:space-between;align-items:center;padding:9px 0;font-size:14px;}
.sb-back{position:fixed;inset:0;background:rgba(15,23,42,.4);z-index:45;}
.menu-btn{display:none;}
@media(max-width:1024px){
  .sb{transform:translateX(-100%);} .sb.open{transform:translateX(0);box-shadow:var(--sh-lg);}
  .main{margin-left:0;} .menu-btn{display:grid;}
  .top{padding:14px 16px;flex-wrap:wrap;} .content{padding:18px 16px 90px;}
  .top-search{order:4;flex-basis:100%;width:100%;}
  .rail{display:none;}
  .rail.drawer{display:block;position:fixed;inset:0 auto 0 0;width:300px;z-index:60;overflow-y:auto;background:var(--bg);padding:20px;animation:slide .28s cubic-bezier(.4,0,.2,1);}
  @keyframes slide{from{transform:translateX(-100%);}}
  .fab{display:inline-flex;}
  .hide-sm{display:none;}
  .apanel{width:calc(100vw - 32px);right:16px;} .afab{right:16px;}
  .specs{grid-template-columns:1fr 1fr;}
  .plans3{grid-template-columns:1fr;} .incl{grid-template-columns:1fr;}
  .pc-hl{transform:none;} .pc{max-width:420px;} .pricing-row{padding-top:0;}
  .opp-stats{grid-template-columns:1fr 1fr;}
  .fgrid{grid-template-columns:1fr;}
}
@media(max-width:640px){
  .vgrid{grid-template-columns:1fr;}
  .vcard{display:flex;align-items:stretch;flex-direction:row;} .vcard .vimg{width:180px;height:auto;min-height:160px;flex-shrink:0;aspect-ratio:auto;}
  .vcard>div:last-child{flex:1;padding:12px;display:flex;flex-direction:column;justify-content:center;min-width:0;}
}
@media(max-width:760px){
  .dt{grid-template-columns:1fr;grid-template-areas:"top" "side" "rest";} .dt-side{position:static;}
}
`;

/* ============================== DATA ============================== */
const brl = (n) => n.toLocaleString("pt-BR");

const PHOTO = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${Math.round((w * 3) / 4)}&q=80`;

// SVG fallback bonito: gradient + silhueta de carro (base64 = compatível em qualquer ambiente)
const carSvg = (colorHex, accentHex = "#0f172a", label = "") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${colorHex}"/><stop offset="100%" stop-color="${accentHex}"/></linearGradient><radialGradient id="glow" cx="75%" cy="30%" r="50%"><stop offset="0%" stop-color="rgba(255,255,255,0.25)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><rect width="800" height="600" fill="url(#bg)"/><rect width="800" height="600" fill="url(#glow)"/><g transform="translate(150 280)" fill="rgba(255,255,255,0.92)"><path d="M30 130 L60 60 Q80 30 120 25 L370 25 Q410 30 430 60 L470 130 L490 130 Q505 130 505 145 L505 175 Q505 195 485 195 L450 195 Q445 220 420 220 Q395 220 390 195 L120 195 Q115 220 90 220 Q65 220 60 195 L25 195 Q5 195 5 175 L5 145 Q5 130 20 130 Z"/><ellipse cx="90" cy="195" rx="28" ry="28" fill="${accentHex}"/><ellipse cx="90" cy="195" rx="12" ry="12" fill="rgba(255,255,255,0.4)"/><ellipse cx="420" cy="195" rx="28" ry="28" fill="${accentHex}"/><ellipse cx="420" cy="195" rx="12" ry="12" fill="rgba(255,255,255,0.4)"/><path d="M90 60 Q105 35 130 35 L240 35 L240 125 L80 125 Z" fill="rgba(15,23,42,0.25)"/><path d="M260 35 L370 35 Q395 35 410 60 L420 125 L260 125 Z" fill="rgba(15,23,42,0.25)"/></g><text x="40" y="560" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="rgba(255,255,255,0.5)" letter-spacing="2">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Helper que gera fotos consistentes pra um veículo a partir da cor
const carPhotos = (colorHex, label) => {
  const dark = "#0f172a",
    mid = "#1e293b",
    light = "#475569";
  return [
    carSvg(colorHex, dark, label),
    carSvg(colorHex, mid, label),
    carSvg(colorHex, light, label),
  ];
};
const VEHICLES = [
  {
    id: 1,
    brand: "BMW",
    model: "320i Sport",
    version: "2.0 Turbo Aut.",
    price: 165000,
    fipe: 198000,
    diff: -17,
    year: 2020,
    km: 47000,
    fuel: "Gasolina",
    transm: "Automático",
    color: "Preto",
    colorHex: "#1e293b",
    city: "São Paulo",
    cat: "Sedan",
    imgs: 18,
    score: 95,
    views: 2010,
    delivery: true,
    fav: true,
    photos: carPhotos("#1e293b", "BMW 320i"),
  },
  {
    id: 2,
    brand: "FIAT",
    model: "500",
    version: "1.4 Flex 8V Evo Mec.",
    price: 25300,
    fipe: 40943,
    diff: -38,
    year: 2012,
    km: 144000,
    fuel: "Flex",
    transm: "Manual",
    color: "Branco",
    colorHex: "#f8fafc",
    city: "Blumenau",
    cat: "Hatch",
    imgs: 12,
    score: 94,
    views: 1240,
    delivery: true,
    fav: false,
    photos: carPhotos("#f1f5f9", "FIAT 500"),
  },
  {
    id: 3,
    brand: "Ford",
    model: "Ranger XLT",
    version: "3.2 Diesel 4x4 Aut.",
    price: 178000,
    fipe: 215000,
    diff: -17,
    year: 2019,
    km: 89000,
    fuel: "Diesel",
    transm: "Automático",
    color: "Prata",
    colorHex: "#cbd5e1",
    city: "Florianópolis",
    cat: "Caminhonete",
    imgs: 21,
    score: 92,
    views: 1680,
    delivery: false,
    fav: false,
    photos: carPhotos("#cbd5e1", "Ford Ranger"),
  },
  {
    id: 4,
    brand: "Jeep",
    model: "Compass Longitude",
    version: "2.0 Diesel 4x4",
    price: 134900,
    fipe: 156000,
    diff: -14,
    year: 2020,
    km: 59000,
    fuel: "Diesel",
    transm: "Automático",
    color: "Branco",
    colorHex: "#f8fafc",
    city: "Curitiba",
    cat: "SUV",
    imgs: 16,
    score: 90,
    views: 1430,
    delivery: true,
    fav: true,
    photos: carPhotos("#e2e8f0", "Jeep Compass"),
  },
  {
    id: 5,
    brand: "Fiat",
    model: "Toro Volcano",
    version: "2.0 Diesel 4x4 Aut.",
    price: 119900,
    fipe: 142000,
    diff: -16,
    year: 2020,
    km: 64000,
    fuel: "Diesel",
    transm: "Automático",
    color: "Cinza",
    colorHex: "#94a3b8",
    city: "Joinville",
    cat: "Caminhonete",
    imgs: 14,
    score: 89,
    views: 1290,
    delivery: false,
    fav: false,
    photos: carPhotos("#94a3b8", "Fiat Toro"),
  },
  {
    id: 6,
    brand: "VW",
    model: "Golf GTI",
    version: "2.0 TSI DSG",
    price: 98900,
    fipe: 112400,
    diff: -12,
    year: 2019,
    km: 52000,
    fuel: "Gasolina",
    transm: "Automático",
    color: "Cinza",
    colorHex: "#94a3b8",
    city: "Rio de Janeiro",
    cat: "Hatch",
    imgs: 15,
    score: 88,
    views: 980,
    delivery: true,
    fav: false,
    photos: carPhotos("#64748b", "VW Golf GTI"),
  },
  {
    id: 7,
    brand: "Toyota",
    model: "Corolla XEI",
    version: "2.0 Flex Aut.",
    price: 112000,
    fipe: 118500,
    diff: -5,
    year: 2021,
    km: 41000,
    fuel: "Flex",
    transm: "Automático",
    color: "Prata",
    colorHex: "#cbd5e1",
    city: "Itajaí",
    cat: "Sedan",
    imgs: 13,
    score: 86,
    views: 1100,
    delivery: false,
    fav: false,
    photos: carPhotos("#cbd5e1", "Toyota Corolla"),
  },
  {
    id: 8,
    brand: "VW",
    model: "T-Cross Comfortline",
    version: "1.0 TSI Aut.",
    price: 99800,
    fipe: 108500,
    diff: -8,
    year: 2021,
    km: 38000,
    fuel: "Flex",
    transm: "Automático",
    color: "Branco",
    colorHex: "#f8fafc",
    city: "Porto Alegre",
    cat: "SUV",
    imgs: 11,
    score: 83,
    views: 870,
    delivery: true,
    fav: false,
    photos: carPhotos("#f1f5f9", "VW T-Cross"),
  },
  {
    id: 9,
    brand: "Honda",
    model: "Civic EXL",
    version: "2.0 Flex Aut.",
    price: 89500,
    fipe: 96200,
    diff: -7,
    year: 2018,
    km: 68000,
    fuel: "Flex",
    transm: "Automático",
    color: "Preto",
    colorHex: "#1e293b",
    city: "Blumenau",
    cat: "Sedan",
    imgs: 10,
    score: 81,
    views: 760,
    delivery: false,
    fav: false,
    photos: carPhotos("#1e293b", "Honda Civic"),
  },
  {
    id: 10,
    brand: "Hyundai",
    model: "HB20",
    version: "1.0 Turbo Aut.",
    price: 58700,
    fipe: 62300,
    diff: -6,
    year: 2022,
    km: 28000,
    fuel: "Flex",
    transm: "Automático",
    color: "Vermelho",
    colorHex: "#dc2626",
    city: "Belo Horizonte",
    cat: "Hatch",
    imgs: 9,
    score: 79,
    views: 540,
    delivery: true,
    fav: false,
    photos: carPhotos("#dc2626", "Hyundai HB20"),
  },
  {
    id: 11,
    brand: "Chevrolet",
    model: "Onix LTZ",
    version: "1.0 Turbo Aut.",
    price: 64200,
    fipe: 67900,
    diff: -5,
    year: 2021,
    km: 35000,
    fuel: "Flex",
    transm: "Automático",
    color: "Cinza",
    colorHex: "#94a3b8",
    city: "Florianópolis",
    cat: "Hatch",
    imgs: 8,
    score: 76,
    views: 610,
    delivery: true,
    fav: false,
    photos: carPhotos("#94a3b8", "Chevrolet Onix"),
  },
  {
    id: 12,
    brand: "Renault",
    model: "Kwid Zen",
    version: "1.0 Flex Mec.",
    price: 42900,
    fipe: 45100,
    diff: -5,
    year: 2022,
    km: 22000,
    fuel: "Flex",
    transm: "Manual",
    color: "Azul",
    colorHex: "#2563eb",
    city: "Joinville",
    cat: "Hatch",
    imgs: 7,
    score: 70,
    views: 320,
    delivery: false,
    fav: false,
    photos: carPhotos("#2563eb", "Renault Kwid"),
  },
];

const BRANDS = [...new Set(VEHICLES.map((v) => v.brand))].sort();
const CATS = [...new Set(VEHICLES.map((v) => v.cat))];
const FUELS = [...new Set(VEHICLES.map((v) => v.fuel))];
const COLORS = [...new Map(VEHICLES.map((v) => [v.color, v.colorHex])).entries()];
const CITY_TO_STATE = {
  Blumenau: "SC",
  Florianópolis: "SC",
  Itajaí: "SC",
  Joinville: "SC",
  "São Paulo": "SP",
  "Rio de Janeiro": "RJ",
  Curitiba: "PR",
  "Porto Alegre": "RS",
  "Belo Horizonte": "MG",
};
const STATES = [...new Set(VEHICLES.map((v) => CITY_TO_STATE[v.city]).filter(Boolean))].sort();
const CITIES_BY_STATE = STATES.reduce((m, uf) => {
  m[uf] = [
    ...new Set(VEHICLES.filter((v) => CITY_TO_STATE[v.city] === uf).map((v) => v.city)),
  ].sort();
  return m;
}, {});

const SORTS = [
  { id: "score", label: "Radar Score", hint: "ranking" },
  { id: "diff", label: "Maior desconto FIPE" },
  { id: "price_asc", label: "Menor preço" },
  { id: "price_desc", label: "Maior preço" },
  { id: "views", label: "Mais vistos" },
];
const DEFAULTS = {
  q: "",
  brand: "",
  cat: "",
  fuel: "",
  color: "",
  state: "",
  city: "",
  pMin: "",
  pMax: "",
  aMin: "",
  aMax: "",
  kmMax: "",
  opp: false,
  deliv: false,
};
const scoreTone = (s) => (s >= 90 ? "trending" : s >= 80 ? "success" : "primary");

const SELLER = { name: "Flash Car Store", phone: "(47) 99812-0042", city: "Blumenau (SC)" };
const STORES = [
  {
    id: "flash",
    name: "Flash Car Store",
    initials: "FC",
    city: "Blumenau",
    state: "SC",
    phone: "(47) 99812-0042",
    since: 2019,
    rating: 4.8,
    reviews: 312,
    verified: true,
    desc: "Multimarcas com foco em seminovos premium. Atendemos toda a região de Blumenau e arredores há mais de 6 anos.",
  },
  {
    id: "topcar",
    name: "Top Car Veículos",
    initials: "TC",
    city: "São Paulo",
    state: "SP",
    phone: "(11) 98712-3344",
    since: 2015,
    rating: 4.6,
    reviews: 580,
    verified: true,
    desc: "Especialistas em SUVs e carros executivos. Loja com showroom climatizado em Pinheiros.",
  },
  {
    id: "premium",
    name: "Premium Motors",
    initials: "PM",
    city: "Rio de Janeiro",
    state: "RJ",
    phone: "(21) 98233-7711",
    since: 2012,
    rating: 4.7,
    reviews: 421,
    verified: true,
    desc: "Concessionária multimarcas focada em carros de alto padrão. Financiamento próprio.",
  },
  {
    id: "auto",
    name: "Auto Center BR",
    initials: "AB",
    city: "Curitiba",
    state: "PR",
    phone: "(41) 99540-2288",
    since: 2018,
    rating: 4.5,
    reviews: 198,
    verified: false,
    desc: "Lojista parceiro com estoque diversificado de hatchs, sedans e caminhonetes.",
  },
  {
    id: "garage",
    name: "Garage 101",
    initials: "G1",
    city: "Porto Alegre",
    state: "RS",
    phone: "(51) 99720-4455",
    since: 2020,
    rating: 4.9,
    reviews: 264,
    verified: true,
    desc: "Curadoria de seminovos com inspeção em 100 pontos. Garantia de 6 meses inclusa.",
  },
  {
    id: "mineira",
    name: "Mineira Motors",
    initials: "MM",
    city: "Belo Horizonte",
    state: "MG",
    phone: "(31) 99811-3322",
    since: 2016,
    rating: 4.4,
    reviews: 178,
    verified: true,
    desc: "Loja familiar com mais de 8 anos no mercado mineiro. Aceita troca.",
  },
];
const STORE_OF = {
  1: "topcar",
  2: "flash",
  3: "flash",
  4: "auto",
  5: "flash",
  6: "premium",
  7: "flash",
  8: "garage",
  9: "flash",
  10: "mineira",
  11: "flash",
  12: "flash",
};
const storeOf = (vehicleId) => STORES.find((s) => s.id === STORE_OF[vehicleId]) || STORES[0];
const OPTIONALS_ALL = [
  // Conforto
  "Ar-condicionado",
  "Ar-condicionado digital",
  "Ar-condicionado dual zone",
  "Direção hidráulica",
  "Direção elétrica",
  "Vidros elétricos",
  "Travas elétricas",
  "Retrovisores elétricos",
  "Retrovisores rebatíveis eletricamente",
  "Volante multifuncional",
  "Volante com regulagem de altura",
  "Bancos em couro",
  "Banco do motorista com ajuste elétrico",
  "Bancos aquecidos",
  "Bancos ventilados",
  "Teto solar",
  "Teto solar panorâmico",
  // Segurança
  "ABS",
  "Airbag duplo",
  "Airbags laterais",
  "Airbags de cortina",
  "Controle de estabilidade",
  "Controle de tração",
  "Assistente de partida em rampa",
  "Freio de estacionamento elétrico",
  "Alarme",
  "Isofix",
  // Multimídia & conectividade
  "Central multimídia",
  "Tela touchscreen",
  "Apple CarPlay",
  "Android Auto",
  "Bluetooth",
  "Entrada USB",
  "Carregador por indução",
  "Som premium",
  "GPS integrado",
  "Computador de bordo",
  // Assistências (ADAS)
  "Câmera de ré",
  "Câmera 360º",
  "Sensor de estacionamento dianteiro",
  "Sensor de estacionamento traseiro",
  "Piloto automático",
  "Piloto automático adaptativo",
  "Frenagem autônoma de emergência",
  "Assistente de faixa",
  "Assistente de farol alto",
  "Detector de ponto cego",
  "Head-up display",
  // Iluminação & exterior
  "Faróis de LED",
  "Faróis de neblina",
  "Acendimento automático dos faróis",
  "Limpador automático",
  "Sensor crepuscular",
  "Rodas de liga leve",
  "Engate de reboque",
  // Partida & chave
  "Partida sem chave (Keyless)",
  "Chave presencial",
  "Botão start/stop",
  // Performance/tração
  "Modo de condução (Eco/Sport)",
  "Tração 4x4",
  "Tração 4x2",
];
const optsOf = (v) => OPTIONALS_ALL.slice(0, 8 + (v.id % 5));
const plateOf = (v) =>
  `M${String.fromCharCode(65 + (v.id % 26))}${String.fromCharCode(65 + ((v.id * 3) % 26))}-${String((v.id * 1373) % 10000).padStart(4, "0")}`;
const favsOf = (v) => Math.max(3, Math.round(v.views / 110));
const obsOf = (v) =>
  `${v.brand} ${v.model} ${v.year}, ${brl(v.km)} km, na cor ${v.color.toLowerCase()}. Revisões em dia, único dono, documentação ok. Aceita troca e financiamento.`;
const yearLabel = (v) =>
  v.yearModel && v.yearModel !== v.year ? `${v.year}/${v.yearModel}` : `${v.year}`;

/* ============================== ATOMS ============================== */
const Badge = ({ tone = "muted", icon: Icon, children }) => {
  const map = {
    primary: ["var(--primary-t)", "var(--primary)"],
    success: ["var(--success-t)", "var(--success)"],
    warning: ["var(--warning-t)", "var(--warning)"],
    trending: ["var(--trending-t)", "var(--trending)"],
    muted: ["var(--muted-t)", "var(--muted)"],
  };
  const [bg, fg] = map[tone];
  return (
    <span className="bdg" style={{ background: bg, color: fg }}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};
const Toggle = ({ on, onClick }) => (
  <button className={`tg${on ? " on" : ""}`} onClick={onClick}>
    <span />
  </button>
);
const SpecTile = ({ icon: Icon, label, value }) => (
  <div className="spec-tile">
    <Icon size={18} className="ic" />
    <div>
      <div className="lab">{label}</div>
      <div className="val">{value}</div>
    </div>
  </div>
);

/* ============================== VEHICLE CARD ============================== */
// Gera array com ellipsis: [1, "...", 4, 5, 6, "...", 12]
const paginationRange = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
};

const Pagination = ({ page, totalPages, totalItems, setPage, startIdx, endIdx }) => {
  if (totalItems === 0) return null;
  const pages = paginationRange(page, totalPages);
  return (
    <div className="pgn">
      <div className="pgn-info">
        Exibindo{" "}
        <b>
          {startIdx + 1}–{endIdx}
        </b>{" "}
        de <b>{totalItems}</b> {totalItems === 1 ? "veículo" : "veículos"}
      </div>
      {totalPages > 1 && (
        <div className="pgn-ctrl">
          <button
            className="pgn-btn"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            title="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`d${i}`} className="pgn-dots">
                ···
              </span>
            ) : (
              <button
                key={p}
                className={`pgn-btn${p === page ? " on" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ),
          )}
          <button
            className="pgn-btn"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            title="Próxima"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// Componente reutilizável de estado vazio: ícone + título + descrição + CTA opcional
const EmptyState = ({ icon: Ic, title, desc, action, tone = "muted" }) => (
  <div className="empty">
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: 20,
        background: `var(--${tone}-t)`,
        color: `var(--${tone})`,
        display: "grid",
        placeItems: "center",
      }}
    >
      <Ic size={32} strokeWidth={1.6} />
    </div>
    <div className="display" style={{ fontSize: 18, fontWeight: 700 }}>
      {title}
    </div>
    {desc && (
      <div className="muted" style={{ fontSize: 14, maxWidth: 360, lineHeight: 1.5 }}>
        {desc}
      </div>
    )}
    {action && (
      <button
        className={`btn btn-${action.tone || "primary"}`}
        onClick={action.onClick}
        style={{ marginTop: 4 }}
      >
        {action.icon && <action.icon size={16} />}
        {action.label}
      </button>
    )}
  </div>
);

const VehicleCard = ({ v, fav, onFav, onOpen }) => (
  <div className="vcard" onClick={() => onOpen(v.id, "catalog")}>
    <div
      className="vimg"
      style={
        photoAt(v, 0)
          ? {
              backgroundImage: `url(${photoAt(v, 0)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      {!photoAt(v, 0) && <Car size={46} strokeWidth={1.4} />}
      {v.diff < 0 && (
        <div className="ov-tl">
          <Badge tone="trending" icon={Zap}>
            {v.diff}% FIPE
          </Badge>
        </div>
      )}
      <button
        className="ov-tr fav"
        onClick={(e) => {
          e.stopPropagation();
          onFav(v.id);
        }}
      >
        <Star
          size={17}
          fill={fav ? "var(--warning)" : "none"}
          color={fav ? "var(--warning)" : "#94a3b8"}
        />
      </button>
      <div className="ov-br">
        <span className="imgcount">
          <LayoutGrid size={11} />
          {imgsOf(v)}
        </span>
      </div>
      {v.delivery && (
        <div className="ov-bl">
          <span className="delivchip">
            <Truck size={12} />
            Entrega
          </span>
        </div>
      )}
    </div>
    <div style={{ padding: 16, flex: 1 }}>
      <div className="display" style={{ fontWeight: 700, fontSize: 16 }}>
        {v.brand} {v.model}
      </div>
      <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
        {v.version}
      </div>
      <div className="num" style={{ fontSize: 22, margin: "12px 0 2px" }}>
        R$ {brl(v.price)}
      </div>
      <div className="muted" style={{ fontSize: 12 }}>
        FIPE R$ {brl(v.fipe)}
      </div>
      <div
        className="ra-flex ra-wrap"
        style={{ gap: 13, marginTop: 13, paddingTop: 13, borderTop: "1px solid var(--border)" }}
      >
        <span className="spec">
          <Calendar size={14} />
          {yearLabel(v)}
        </span>
        <span className="spec">
          <Gauge size={14} />
          {brl(v.km)} km
        </span>
        <span className="spec">
          <Fuel size={14} />
          {v.fuel}
        </span>
        <span className="spec">
          <MapPin size={14} />
          {v.city}
        </span>
      </div>
      <div className="ra-flex ra-between ra-center" style={{ marginTop: 14 }}>
        <div className="ra-flex ra-center" style={{ gap: 7 }}>
          <span
            className="score"
            style={{
              background: `var(--${scoreTone(v.score)}-t)`,
              color: `var(--${scoreTone(v.score)})`,
            }}
          >
            <Zap size={12} fill="currentColor" />
            {v.score}
          </span>
          {(v.views || 0) >= 1300 && (
            <span
              className="bdg"
              style={{ background: "var(--trending-t)", color: "var(--trending)" }}
            >
              <Flame size={12} />
              Em alta
            </span>
          )}
        </div>
        <span className="spec">
          <Eye size={14} />
          {brl(v.views)}
        </span>
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="vcard" style={{ cursor: "default" }}>
    <div className="sk" style={{ height: 168, borderRadius: 0 }} />
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 11 }}>
      <div className="sk" style={{ height: 16, width: "65%" }} />
      <div className="sk" style={{ height: 12, width: "85%" }} />
      <div className="sk" style={{ height: 22, width: "50%", marginTop: 4 }} />
      <div className="sk" style={{ height: 12, width: "100%", marginTop: 8 }} />
    </div>
  </div>
);

/* ============================== FILTER RAIL ============================== */
const FilterRail = ({ f, set, reset, drawer, onClose }) => (
  <aside className={`rail${drawer ? " drawer" : ""}`}>
    {drawer && (
      <div className="ra-flex ra-between ra-center" style={{ marginBottom: 16 }}>
        <div className="display" style={{ fontWeight: 700, fontSize: 18 }}>
          Filtros
        </div>
        <button className="icon-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    )}
    <div className="rail-card">
      <div className="ra-flex ra-between ra-center" style={{ marginBottom: 4 }}>
        <span className="micro">Filtros</span>
        <button className="btn btn-ghost btn-sm" onClick={reset} style={{ padding: "5px 8px" }}>
          Limpar
        </button>
      </div>
      <div className="fgroup">
        <label className="lbl">Estado</label>
        <select
          className="inp"
          value={f.state}
          onChange={(e) => {
            set("state", e.target.value);
            set("city", "");
          }}
        >
          <option value="">Todos</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="fgroup">
        <label className="lbl">Cidade</label>
        <select
          className="inp"
          value={f.city}
          disabled={!f.state}
          onChange={(e) => set("city", e.target.value)}
        >
          <option value="">{f.state ? "Todas" : "Escolha um estado"}</option>
          {(CITIES_BY_STATE[f.state] || []).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="fgroup">
        <label className="lbl">Marca</label>
        <select className="inp" value={f.brand} onChange={(e) => set("brand", e.target.value)}>
          <option value="">Todas</option>
          {BRANDS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>
      <div className="fgroup">
        <label className="lbl">Categoria</label>
        <select className="inp" value={f.cat} onChange={(e) => set("cat", e.target.value)}>
          <option value="">Todas</option>
          {CATS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="fgroup">
        <label className="lbl">Preço (R$)</label>
        <div className="ra-flex" style={{ gap: 8 }}>
          <input
            className="inp"
            placeholder="Mín"
            value={f.pMin}
            onChange={(e) => set("pMin", e.target.value)}
          />
          <input
            className="inp"
            placeholder="Máx"
            value={f.pMax}
            onChange={(e) => set("pMax", e.target.value)}
          />
        </div>
      </div>
      <div className="fgroup">
        <label className="lbl">Ano</label>
        <div className="ra-flex" style={{ gap: 8 }}>
          <input
            className="inp"
            placeholder="De"
            value={f.aMin}
            onChange={(e) => set("aMin", e.target.value)}
          />
          <input
            className="inp"
            placeholder="Até"
            value={f.aMax}
            onChange={(e) => set("aMax", e.target.value)}
          />
        </div>
      </div>
      <div className="fgroup">
        <label className="lbl">KM máximo</label>
        <input
          className="inp"
          placeholder="Ex.: 80000"
          value={f.kmMax}
          onChange={(e) => set("kmMax", e.target.value)}
        />
      </div>
      <div className="fgroup">
        <label className="lbl">Combustível</label>
        <select className="inp" value={f.fuel} onChange={(e) => set("fuel", e.target.value)}>
          <option value="">Todos</option>
          {FUELS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="fgroup">
        <label className="lbl">Cor</label>
        <div className="ra-flex ra-wrap" style={{ gap: 8 }}>
          {COLORS.map(([name, hex]) => (
            <button
              key={name}
              title={name}
              onClick={() => set("color", f.color === name ? "" : name)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                cursor: "pointer",
                background: hex,
                border: f.color === name ? "2px solid var(--primary)" : "2px solid var(--border)",
                boxShadow: f.color === name ? "0 0 0 3px var(--primary-t)" : "none",
              }}
            />
          ))}
        </div>
      </div>
      <div className="fgroup">
        <div className="ra-flex ra-between ra-center">
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Flame size={15} color="var(--trending)" />
              Só oportunidades
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              20%+ abaixo da FIPE
            </div>
          </div>
          <Toggle on={f.opp} onClick={() => set("opp", !f.opp)} />
        </div>
      </div>
      <div className="fgroup">
        <div className="ra-flex ra-between ra-center">
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Truck size={15} color="var(--success)" />
              Só com entrega
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              Lojas que entregam
            </div>
          </div>
          <Toggle on={f.deliv} onClick={() => set("deliv", !f.deliv)} />
        </div>
      </div>
    </div>
  </aside>
);

/* ============================== MARKETPLACE ============================== */
const Marketplace = ({ externalQ, favorites, onFav, onOpen, myVehicles = [] }) => {
  const [f, setF] = useState(DEFAULTS);
  const [sort, setSort] = useState("score");
  const [ddOpen, setDd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 48;
  const [drawer, setDrawer] = useState(false);
  const set = (k, val) => setF((p) => ({ ...p, [k]: val }));
  const reset = () => setF((p) => ({ ...DEFAULTS, q: p.q }));
  useEffect(() => {
    setF((p) => ({ ...p, q: externalQ }));
  }, [externalQ]);

  // Mescla VEHICLES (seed) + myVehicles ACTIVE — myVehicles vencem em caso de id duplicado (versão mais recente)
  const allVehicles = useMemo(() => {
    const mine = myVehicles.filter((v) => v.status === "ACTIVE");
    const mineIds = new Set(mine.map((v) => v.id));
    return [...mine, ...VEHICLES.filter((v) => !mineIds.has(v.id))];
  }, [myVehicles]);

  const filtered = useMemo(() => {
    const r = allVehicles.filter((v) => {
      const q = (f.q || "").trim().toLowerCase();
      if (q && !`${v.brand} ${v.model} ${v.version}`.toLowerCase().includes(q)) return false;
      if (f.brand && v.brand !== f.brand) return false;
      if (f.cat && v.cat !== f.cat) return false;
      if (f.fuel && v.fuel !== f.fuel) return false;
      if (f.color && v.color !== f.color) return false;
      if (f.pMin && v.price < +f.pMin) return false;
      if (f.pMax && v.price > +f.pMax) return false;
      if (f.aMin && v.year < +f.aMin) return false;
      if (f.aMax && v.year > +f.aMax) return false;
      if (f.kmMax && v.km > +f.kmMax) return false;
      if (f.opp && v.diff > -20) return false;
      if (f.deliv && !v.delivery) return false;
      if (f.state && CITY_TO_STATE[v.city] !== f.state) return false;
      if (f.city && v.city !== f.city) return false;
      return true;
    });
    const cmp = {
      score: (a, b) => b.score - a.score,
      diff: (a, b) => a.diff - b.diff,
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      views: (a, b) => b.views - a.views,
    }[sort];
    return [...r].sort(cmp);
  }, [f, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * perPage;
  const endIdx = Math.min(startIdx + perPage, filtered.length);
  const paginated = filtered.slice(startIdx, endIdx);
  useEffect(() => {
    setPage(1);
  }, [f, sort]);
  const goToPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const opportunities = useMemo(
    () =>
      VEHICLES.filter((v) => v.diff <= -15)
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 4),
    [],
  );
  const activeChips = useMemo(() => {
    const c = [];
    if (f.brand) c.push(["brand", f.brand]);
    if (f.cat) c.push(["cat", f.cat]);
    if (f.fuel) c.push(["fuel", f.fuel]);
    if (f.color) c.push(["color", f.color]);
    if (f.state) c.push(["state", f.state]);
    if (f.city) c.push(["city", f.city]);
    if (f.pMin) c.push(["pMin", `≥ R$ ${brl(+f.pMin)}`]);
    if (f.pMax) c.push(["pMax", `≤ R$ ${brl(+f.pMax)}`]);
    if (f.aMin) c.push(["aMin", `${f.aMin}+`]);
    if (f.aMax) c.push(["aMax", `até ${f.aMax}`]);
    if (f.kmMax) c.push(["kmMax", `≤ ${brl(+f.kmMax)} km`]);
    if (f.opp) c.push(["opp", "Oportunidades"]);
    if (f.deliv) c.push(["deliv", "Com entrega"]);
    return c;
  }, [f]);
  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1100);
  };

  return (
    <>
      {drawer && <div className="sb-back" onClick={() => setDrawer(false)} />}

      <div className="toolbar">
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>
          {loading ? (
            "Carregando..."
          ) : (
            <>
              <span className="num" style={{ fontSize: 16 }}>
                {filtered.length}
              </span>{" "}
              <span className="muted">veículos</span>
            </>
          )}
        </div>
        <button className="dd-btn fab" onClick={() => setDrawer(true)}>
          <SlidersHorizontal size={16} />
          Filtros
          {activeChips.length > 0 && (
            <span
              style={{
                background: "var(--primary)",
                color: "#fff",
                borderRadius: 999,
                fontSize: 11,
                padding: "1px 7px",
              }}
            >
              {activeChips.length}
            </span>
          )}
        </button>
        <div style={{ marginLeft: "auto" }} className="ra-flex ra-center">
          <button
            className="icon-btn"
            onClick={refresh}
            style={{ marginRight: 10 }}
            title="Atualizar"
          >
            <RotateCcw size={17} className={loading ? "spin" : ""} />
          </button>
          <div className="dd">
            <button className="dd-btn" onClick={() => setDd(!ddOpen)}>
              <ArrowDownWideNarrow size={16} />
              {SORTS.find((s) => s.id === sort).label}
              <ChevronDown size={15} />
            </button>
            {ddOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 20 }}
                  onClick={() => setDd(false)}
                />
                <div className="dd-menu">
                  {SORTS.map((s) => (
                    <div
                      key={s.id}
                      className={`dd-item${sort === s.id ? " on" : ""}`}
                      onClick={() => {
                        setSort(s.id);
                        setDd(false);
                      }}
                    >
                      {s.id === "score" && <Zap size={15} />}
                      {s.label}
                      {s.hint && (
                        <span className="muted" style={{ fontSize: 11, marginLeft: "auto" }}>
                          {s.hint}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="ra-flex ra-wrap" style={{ gap: 8, marginBottom: 18 }}>
          {activeChips.map(([k, label]) => (
            <span key={k} className="achip">
              {label}
              <button
                onClick={() => {
                  set(k, ["opp", "deliv"].includes(k) ? false : "");
                  if (k === "state") set("city", "");
                }}
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={reset}>
            Limpar tudo
          </button>
        </div>
      )}

      <div className="mk">
        <FilterRail f={f} set={set} reset={reset} />
        <FilterRail
          f={f}
          set={set}
          reset={reset}
          drawer={drawer}
          onClose={() => setDrawer(false)}
        />
        <div className="mkmain">
          {loading ? (
            <div className="vgrid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum veículo encontrado"
              desc="Tente ajustar ou limpar os filtros para ver mais resultados. Você pode também ampliar a faixa de preço ou ano para mais opções."
              action={{ label: "Limpar filtros", icon: RotateCcw, onClick: reset }}
            />
          ) : (
            <div className="vgrid">
              {paginated.map((v) => (
                <VehicleCard
                  key={v.id}
                  v={v}
                  fav={favorites.has(v.id)}
                  onFav={onFav}
                  onOpen={onOpen}
                />
              ))}
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              setPage={goToPage}
              startIdx={startIdx}
              endIdx={endIdx}
            />
          )}
        </div>
      </div>
    </>
  );
};

/* ============================== DETAIL: GALLERY ============================== */
const FREE_IMG_LIMIT = 3;
const Gallery = ({ v, premium, track }) => {
  const [i, setI] = useState(0);
  const [lb, setLb] = useState(false);
  const total = imgsOf(v);
  const locked = !premium && i >= FREE_IMG_LIMIT;
  const go = (d) => setI((p) => (p + d + total) % total);
  const openLb = () => {
    if (locked) {
      track("paywall_view", { feature: "gallery", image: i + 1 });
      return;
    }
    setLb(true);
    track("gallery_open", { vehicle_id: v.id, image: i + 1 });
  };
  const curPhoto = photoAt(v, i);
  return (
    <>
      <div
        className="gal-main"
        style={
          curPhoto && !locked
            ? {
                backgroundImage: `url(${curPhoto})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
        onClick={openLb}
      >
        {locked ? (
          <div className="gal-lockover">
            <div className="lock-c">
              <Lock size={20} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Galeria completa é Premium</div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              +{total - FREE_IMG_LIMIT} fotos bloqueadas
            </div>
          </div>
        ) : (
          !curPhoto && (
            <div style={{ textAlign: "center" }}>
              <ImageIcon size={52} strokeWidth={1.3} />
              <div style={{ fontSize: 12, marginTop: 6 }}>Foto {i + 1}</div>
            </div>
          )
        )}
        {total > 1 && (
          <button
            className="gal-arrow l"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {total > 1 && (
          <button
            className="gal-arrow r"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            <ChevronRight size={20} />
          </button>
        )}
        {!locked && (
          <span className="gal-count">
            <Maximize2 size={13} />
            {i + 1}/{total}
          </span>
        )}
      </div>
      <div className="gal-thumbs">
        {Array.from({ length: total }).map((_, idx) => {
          const lk = !premium && idx >= FREE_IMG_LIMIT;
          const tp = photoAt(v, idx);
          return (
            <div
              key={idx}
              className={`thumb${i === idx ? " on" : ""}`}
              style={
                tp && !lk
                  ? {
                      backgroundImage: `url(${tp})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {}
              }
              onClick={() => {
                setI(idx);
                if (lk) track("paywall_view", { feature: "gallery", image: idx + 1 });
              }}
            >
              {!tp && <ImageIcon size={18} />}
              {lk && (
                <div className="thumb-lock">
                  <Lock size={15} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {lb && (
        <div className="lb" onClick={() => setLb(false)}>
          <div
            className="lb-img"
            onClick={(e) => e.stopPropagation()}
            style={
              curPhoto
                ? {
                    backgroundImage: `url(${curPhoto})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }
                : {}
            }
          >
            <button className="lb-close" onClick={() => setLb(false)}>
              <X size={20} />
            </button>
            {!curPhoto && (
              <div style={{ textAlign: "center" }}>
                <ImageIcon size={64} strokeWidth={1.2} />
                <div style={{ marginTop: 8 }}>
                  Foto {i + 1} de {total}
                </div>
              </div>
            )}
            {total > 1 && (
              <button className="gal-arrow l" onClick={() => go(-1)}>
                <ChevronLeft size={20} />
              </button>
            )}
            {total > 1 && (
              <button className="gal-arrow r" onClick={() => go(1)}>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const ContactCard = ({ v, premium, track, onUpgrade, onOpenStore }) => {
  const s = storeOf(v.id);
  return (
    <div className="card card-p">
      <div className="ra-flex ra-between ra-center" style={{ marginBottom: 16 }}>
        <span className="micro">Contato do vendedor</span>
        {premium ? (
          <Badge tone="success" icon={Check}>
            Liberado
          </Badge>
        ) : (
          <Badge tone="trending" icon={Crown}>
            Premium
          </Badge>
        )}
      </div>
      {premium ? (
        <>
          <button
            onClick={() => onOpenStore(s.id)}
            style={{
              width: "100%",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
              padding: 10,
              borderRadius: 12,
              background: "var(--bg-2)",
              border: "none",
              cursor: "pointer",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
          >
            <div className="av" style={{ borderRadius: 12 }}>
              {s.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ra-flex ra-center" style={{ gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{s.name}</span>
                {s.verified && <ShieldCheck size={13} color="var(--success)" />}
              </div>
              <div
                className="muted"
                style={{ fontSize: 12.5, display: "flex", gap: 8, alignItems: "center" }}
              >
                <Star size={11} fill="var(--warning)" color="var(--warning)" />
                {s.rating} · {s.city} ({s.state})
              </div>
            </div>
            <ChevronRight size={16} color="var(--muted)" />
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="ra-flex ra-center" style={{ gap: 8, fontWeight: 600, fontSize: 16 }}>
              <Phone size={16} color="var(--muted)" />
              {s.phone}
            </div>
            <button
              className="btn btn-wa btn-block"
              onClick={() => track("whatsapp_click", { vehicle_id: v.id })}
            >
              <MessageCircle size={17} />
              Chamar no WhatsApp
            </button>
            <button
              className="btn btn-secondary btn-block"
              onClick={() => track("telegram_click", { vehicle_id: v.id })}
            >
              <Send size={16} />
              Telegram
            </button>
          </div>
        </>
      ) : (
        <div className="gate" style={{ minHeight: 200 }}>
          <div className="gate-blur" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="ra-flex ra-center" style={{ gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--bg-2)" }} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 13,
                    width: "62%",
                    background: "var(--border)",
                    borderRadius: 5,
                    marginBottom: 7,
                  }}
                />
                <div
                  style={{ height: 11, width: "40%", background: "var(--bg-2)", borderRadius: 5 }}
                />
              </div>
            </div>
            <div className="ra-flex ra-center" style={{ gap: 8, fontWeight: 600, fontSize: 16 }}>
              <Phone size={16} />
              (••) •••••-••••
            </div>
            <div style={{ height: 44, borderRadius: 13, background: "var(--bg-2)" }} />
          </div>
          <div className="gate-over">
            <div className="lock-c">
              <Lock size={20} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Contato é Premium</div>
            <div className="muted" style={{ fontSize: 12.5, maxWidth: 240, lineHeight: 1.4 }}>
              Vendedor, telefone e WhatsApp ficam visíveis no plano Premium.
            </div>
            <button
              className="btn btn-trending btn-sm"
              style={{ marginTop: 4 }}
              onClick={() => {
                track("upgrade_click", { source: "contact", vehicle_id: v.id });
                onUpgrade();
              }}
            >
              <Crown size={15} />
              Desbloquear
            </button>
          </div>
        </div>
      )}
      <div
        className="muted hide-sm"
        style={{ fontSize: 11, marginTop: 14, lineHeight: 1.4, display: "flex", gap: 6 }}
      >
        <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        No produto real, o backend não envia este dado para usuários FREE — o blur é apenas UX.
      </div>
    </div>
  );
};

const InsightsCard = ({ v, premium, track, onUpgrade }) => {
  const Body = (
    <>
      <div className="irow">
        <span className="muted" style={{ fontSize: 13 }}>
          Diferença da FIPE
        </span>
        <span className="num" style={{ color: "var(--trending)", fontSize: 16 }}>
          {v.diff}%
        </span>
      </div>
      <div className="irow">
        <span className="muted" style={{ fontSize: 13 }}>
          Demanda
        </span>
        <Badge tone="trending" icon={Flame}>
          {v.score >= 88 ? "Alta" : "Média"}
        </Badge>
      </div>
      <div className="irow">
        <span className="muted" style={{ fontSize: 13 }}>
          Visualizações (7d)
        </span>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>
          {brl(v.views)} · <span style={{ color: "var(--success)" }}>+18%</span>
        </span>
      </div>
      <div className="irow">
        <span className="muted" style={{ fontSize: 13 }}>
          Favoritado por
        </span>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{favsOf(v)} pessoas</span>
      </div>
      <div className="irow">
        <span className="muted" style={{ fontSize: 13 }}>
          Posição no ranking
        </span>
        <Badge tone="success" icon={TrendingUp}>
          Top {Math.max(2, 100 - v.score)}%
        </Badge>
      </div>
    </>
  );
  return (
    <div className="card card-p">
      <div className="ra-flex ra-between ra-center" style={{ marginBottom: 8 }}>
        <span className="micro" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} color="var(--primary)" />
          Insights
        </span>
        {!premium && (
          <Badge tone="trending" icon={Crown}>
            Premium
          </Badge>
        )}
      </div>
      {premium ? (
        Body
      ) : (
        <div className="gate">
          <div className="gate-blur">{Body}</div>
          <div className="gate-over">
            <div className="lock-c">
              <Lock size={20} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Insights são Premium</div>
            <div className="muted" style={{ fontSize: 12, maxWidth: 200 }}>
              Demanda, ranking e comportamento deste anúncio.
            </div>
            <button
              className="btn btn-trending btn-sm"
              onClick={() => {
                track("upgrade_click", { source: "insights", vehicle_id: v.id });
                onUpgrade();
              }}
            >
              <Crown size={15} />
              Desbloquear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================== DETAIL PAGE ============================== */
const Detail = ({ v, premium, track, fav, onFav, onOpen, onUpgrade, onOpenStore }) => {
  const optionals = optsOf(v);
  const similar = useMemo(
    () =>
      VEHICLES.filter((x) => x.id !== v.id)
        .sort((a, b) => a.diff - b.diff)
        .slice(0, 4),
    [v.id],
  );
  return (
    <>
      <div className="ra-flex ra-between ra-center ra-wrap" style={{ gap: 12, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div className="ra-flex ra-center ra-wrap" style={{ gap: 8, marginBottom: 6 }}>
            <Badge tone="success" icon={Check}>
              Ativo
            </Badge>
            {v.diff <= -20 && (
              <Badge tone="trending" icon={Zap}>
                Oportunidade · {v.diff}% FIPE
              </Badge>
            )}
            {v.delivery && (
              <Badge tone="primary" icon={Truck}>
                Entrega
              </Badge>
            )}
          </div>
          <h1 className="display" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
            {v.brand} {v.model} ·{" "}
            <span style={{ fontWeight: 500, color: "var(--muted)" }}>{v.version}</span>
          </h1>
        </div>
        <div className="ra-flex ra-center" style={{ gap: 8 }}>
          <button className="icon-btn" onClick={() => track("share_click", { vehicle_id: v.id })}>
            <Share2 size={18} />
          </button>
          <button
            className="icon-btn"
            onClick={() => onFav(v.id)}
            style={fav ? { borderColor: "var(--warning)", color: "var(--warning)" } : undefined}
          >
            <Star size={18} fill={fav ? "var(--warning)" : "none"} />
          </button>
        </div>
      </div>
      <div className="dt">
        <div className="dt-top">
          <Gallery v={v} premium={premium} track={track} />
        </div>

        <div className="dt-rest">
          <div className="card card-p">
            <span className="micro">Ficha técnica</span>
            <div className="specs" style={{ marginTop: 16 }}>
              <SpecTile icon={Calendar} label="Ano" value={yearLabel(v)} />
              <SpecTile icon={Gauge} label="KM" value={`${brl(v.km)} km`} />
              <SpecTile icon={Fuel} label="Combustível" value={v.fuel} />
              <SpecTile icon={Cog} label="Câmbio" value={v.transm} />
              <SpecTile icon={Palette} label="Cor" value={v.color} />
              <SpecTile icon={Car} label="Categoria" value={v.cat} />
              <SpecTile
                icon={MapPin}
                label="Localização"
                value={`${v.city} (${CITY_TO_STATE[v.city] || "SC"})`}
              />
              <SpecTile icon={Tag} label="Placa" value={plateOf(v)} />
            </div>
          </div>
          <div className="card card-p" style={{ marginTop: 18 }}>
            <span className="micro">Opcionais</span>
            <div className="opts" style={{ marginTop: 14 }}>
              {optionals.map((o) => (
                <span key={o} className="opt">
                  <Check size={14} className="ck" />
                  {o}
                </span>
              ))}
            </div>
          </div>
          <div className="card card-p" style={{ marginTop: 18 }}>
            <span className="micro">Observações</span>
            <p style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.6 }}>{obsOf(v)}</p>
          </div>
          {v.delivery && (
            <div
              className="card card-p"
              style={{
                marginTop: 18,
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                borderColor: "rgba(16,185,129,.25)",
                background: "linear-gradient(120deg,rgba(16,185,129,.06),transparent)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--success-t)",
                  color: "var(--success)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Truck size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Entrega disponível</div>
                <div className="muted" style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>
                  Esta loja entrega o veículo na sua região. Prazo de 2 a 5 dias úteis · frete a
                  combinar com a loja na conversa.
                </div>
              </div>
            </div>
          )}
          <div style={{ marginTop: 18 }}>
            <InsightsCard v={v} premium={premium} track={track} onUpgrade={onUpgrade} />
          </div>
          <div style={{ marginTop: 26 }}>
            <div className="ra-flex ra-center" style={{ gap: 8, marginBottom: 14 }}>
              <Flame size={18} color="var(--trending)" />
              <h2 className="display" style={{ fontSize: 18, fontWeight: 700 }}>
                Outras oportunidades
              </h2>
            </div>
            <div className="sim-row">
              {similar.map((s) => (
                <div key={s.id} className="sim" onClick={() => onOpen(s.id, "similar")}>
                  <div className="sim-img">
                    <Car size={32} strokeWidth={1.4} />
                    {s.diff <= -15 && (
                      <div style={{ position: "absolute", top: 8, left: 8 }}>
                        <Badge tone="trending">{s.diff}%</Badge>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 12 }}>
                    <div className="display" style={{ fontWeight: 700, fontSize: 14 }}>
                      {s.brand} {s.model}
                    </div>
                    <div className="num" style={{ fontSize: 16, marginTop: 4 }}>
                      R$ {brl(s.price)}
                    </div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                      {s.city}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dt-side">
          <div className="card card-p">
            {/* PREÇO */}
            <div className="ra-flex ra-between ra-center">
              <span className="micro">Preço</span>
              <span
                className="score"
                style={{ background: "var(--trending-t)", color: "var(--trending)" }}
              >
                <Zap size={12} fill="currentColor" />
                {v.score}
              </span>
            </div>
            <div className="num" style={{ fontSize: 30, margin: "8px 0 2px" }}>
              R$ {brl(v.price)}
            </div>
            <div className="ra-flex ra-center" style={{ gap: 8 }}>
              <span className="muted" style={{ fontSize: 13 }}>
                FIPE R$ {brl(v.fipe)}
              </span>
              <Badge tone="trending">{v.diff}%</Badge>
            </div>
            <div
              className="ra-flex ra-center"
              style={{ gap: 6, marginTop: 12, color: "var(--muted)", fontSize: 12 }}
            >
              <Eye size={13} />
              {brl(v.views)} visualizações · {favsOf(v)} favoritos
            </div>

            {/* DIVISOR */}
            <div style={{ height: 1, background: "var(--border)", margin: "18px -22px" }} />

            {/* VENDEDOR */}
            <div className="ra-flex ra-between ra-center" style={{ marginBottom: 12 }}>
              <span className="micro">Vendedor</span>
              {premium ? (
                <Badge tone="success" icon={Check}>
                  Liberado
                </Badge>
              ) : (
                <Badge tone="trending" icon={Crown}>
                  Premium
                </Badge>
              )}
            </div>
            {premium ? (
              (() => {
                const s = storeOf(v.id);
                return (
                  <>
                    <button
                      onClick={() => onOpenStore(s.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 14,
                        padding: 10,
                        borderRadius: 12,
                        background: "var(--bg-2)",
                        border: "none",
                        cursor: "pointer",
                        transition: "all .15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
                    >
                      <div className="av" style={{ borderRadius: 12 }}>
                        {s.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ra-flex ra-center" style={{ gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                          {s.verified && <ShieldCheck size={13} color="var(--success)" />}
                        </div>
                        <div
                          className="muted"
                          style={{ fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}
                        >
                          <Star size={11} fill="var(--warning)" color="var(--warning)" />
                          {s.rating} · {s.city}
                        </div>
                      </div>
                      <ChevronRight size={16} color="var(--muted)" />
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div
                        className="ra-flex ra-center"
                        style={{ gap: 8, fontWeight: 600, fontSize: 15 }}
                      >
                        <Phone size={15} color="var(--muted)" />
                        {s.phone}
                      </div>
                      <button
                        className="btn btn-wa btn-block"
                        onClick={() => track("whatsapp_click", { vehicle_id: v.id })}
                      >
                        <MessageCircle size={17} />
                        Chamar no WhatsApp
                      </button>
                      <button
                        className="btn btn-secondary btn-block"
                        onClick={() => track("telegram_click", { vehicle_id: v.id })}
                      >
                        <Send size={16} />
                        Telegram
                      </button>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="gate" style={{ minHeight: 170 }}>
                <div
                  className="gate-blur"
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div className="ra-flex ra-center" style={{ gap: 12 }}>
                    <div
                      style={{ width: 38, height: 38, borderRadius: 11, background: "var(--bg-2)" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          height: 12,
                          width: "62%",
                          background: "var(--border)",
                          borderRadius: 5,
                          marginBottom: 6,
                        }}
                      />
                      <div
                        style={{
                          height: 10,
                          width: "40%",
                          background: "var(--bg-2)",
                          borderRadius: 5,
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="ra-flex ra-center"
                    style={{ gap: 8, fontWeight: 600, fontSize: 15 }}
                  >
                    <Phone size={15} />
                    (••) •••••-••••
                  </div>
                  <div style={{ height: 42, borderRadius: 13, background: "var(--bg-2)" }} />
                </div>
                <div className="gate-over">
                  <div className="lock-c">
                    <Lock size={20} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>Contato é Premium</div>
                  <button
                    className="btn btn-trending btn-sm"
                    style={{ marginTop: 4 }}
                    onClick={() => {
                      track("upgrade_click", { source: "contact", vehicle_id: v.id });
                      onUpgrade();
                    }}
                  >
                    <Crown size={15} />
                    Desbloquear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* ============================== PÁGINA DA LOJA ============================== */
const StorePage = ({ storeId, premium, favorites, onFav, onOpenVehicle, onBack, track }) => {
  const s = STORES.find((x) => x.id === storeId);
  const stock = useMemo(() => VEHICLES.filter((v) => STORE_OF[v.id] === storeId), [storeId]);
  const activeCount = stock.length;
  const avgDiff = activeCount ? Math.round(stock.reduce((a, v) => a + v.diff, 0) / activeCount) : 0;
  const opps = stock.filter((v) => v.diff <= -20).length;
  if (!s) return null;

  return (
    <>
      {/* HERO + INFO CARD UNIFICADO */}
      <div className="card" style={{ marginBottom: 22, overflow: "hidden" }}>
        {/* Faixa azul de topo */}
        <div
          style={{
            height: 110,
            background: "linear-gradient(120deg, var(--primary), #3b82f6 60%, #60a5fa)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 80% 50%, rgba(255,255,255,.15), transparent 50%)",
            }}
          />
        </div>

        {/* Conteúdo */}
        <div style={{ padding: "0 24px 22px", position: "relative" }}>
          {/* Avatar overflowing */}
          <div
            className="av"
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              fontSize: 26,
              border: "4px solid var(--card)",
              boxShadow: "var(--sh)",
              marginTop: -44,
              marginBottom: 18,
              position: "relative",
              zIndex: 2,
            }}
          >
            {s.initials}
          </div>

          {/* Info + ações */}
          <div className="ra-flex ra-between ra-wrap" style={{ gap: 14, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="ra-flex ra-center ra-wrap" style={{ gap: 10, marginBottom: 8 }}>
                <h2 className="display" style={{ fontSize: 22, fontWeight: 700 }}>
                  {s.name}
                </h2>
                {s.verified && (
                  <Badge tone="success" icon={ShieldCheck}>
                    Verificada
                  </Badge>
                )}
              </div>
              <div
                className="ra-flex ra-center ra-wrap"
                style={{ gap: 14, fontSize: 13, color: "var(--muted)" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={13} />
                  {s.city} ({s.state})
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Star size={13} fill="var(--warning)" color="var(--warning)" />
                  <b style={{ color: "var(--text)" }}>{s.rating}</b> ({s.reviews} avaliações)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={13} />
                  Desde {s.since}
                </span>
              </div>
            </div>

            <div className="ra-flex ra-wrap" style={{ gap: 8, flexShrink: 0 }}>
              {premium ? (
                <>
                  <button
                    className="btn btn-wa btn-sm"
                    onClick={() => track("whatsapp_click", { store_id: s.id })}
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Phone size={14} />
                    {s.phone}
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-trending btn-sm"
                  onClick={() => track("upgrade_click", { source: "store", store_id: s.id })}
                >
                  <Crown size={15} />
                  Desbloquear contato
                </button>
              )}
            </div>
          </div>

          {/* Sobre a loja */}
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
            <span className="micro" style={{ display: "block", marginBottom: 8 }}>
              Sobre a loja
            </span>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)", margin: 0 }}>
              {s.desc}
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="opp-stats">
        <OStat icon={Car} tint="primary" label="Anúncios" value={activeCount} sub="no estoque" />
        <OStat
          icon={Flame}
          tint="trending"
          label="Oportunidades"
          value={opps}
          sub="−20%+ da FIPE"
        />
        <OStat
          icon={TrendingDown}
          tint="success"
          label="Média vs FIPE"
          value={`${avgDiff}%`}
          sub="do estoque"
        />
        <OStat
          icon={Star}
          tint="warning"
          label="Avaliação"
          value={s.rating}
          sub={`${s.reviews} avaliações`}
        />
      </div>

      {/* ESTOQUE */}
      <div className="ra-flex ra-between ra-center ra-wrap" style={{ gap: 12, marginBottom: 14 }}>
        <div className="ra-flex ra-center" style={{ gap: 8 }}>
          <Package size={18} color="var(--primary)" />
          <h2 className="display" style={{ fontSize: 18, fontWeight: 700 }}>
            Estoque
          </h2>
          <span className="muted" style={{ fontSize: 13 }}>
            · {stock.length} {stock.length === 1 ? "veículo" : "veículos"}
          </span>
        </div>
      </div>

      {stock.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sem veículos no estoque"
          desc="Esta loja não tem anúncios ativos no momento. Volte em breve ou navegue por outras lojas no catálogo."
        />
      ) : (
        <div className="vgrid">
          {stock.map((v) => (
            <VehicleCard
              key={v.id}
              v={v}
              fav={favorites.has(v.id)}
              onFav={onFav}
              onOpen={onOpenVehicle}
            />
          ))}
        </div>
      )}
    </>
  );
};

/* ============================== ANALYTICS PANEL ============================== */
const EV_TONE = {
  catalog_view: "muted",
  vehicle_view: "primary",
  gallery_open: "primary",
  favorite_added: "warning",
  favorite_removed: "muted",
  whatsapp_click: "success",
  telegram_click: "success",
  upgrade_click: "trending",
  paywall_view: "trending",
  share_click: "primary",
  plan_changed: "muted",
  checkout_started: "trending",
  subscription_completed: "success",
  subscription_cancelled: "muted",
  listing_created: "success",
  listing_updated: "primary",
  listing_status_changed: "primary",
  listing_removed: "muted",
  lead_whatsapp: "success",
  lead_telegram: "success",
  listing_submitted_for_approval: "warning",
  listing_approved: "success",
  listing_rejected: "muted",
  employee_created: "success",
  employee_toggled: "primary",
  employee_removed: "muted",
  logout: "muted",
  store_view: "primary",
};
/* ============================== THEME PICKER ============================== */
const THEMES = [
  { id: "blue", name: "Blue", base: "#2563EB", hover: "#1D4ED8", tint: "rgba(37,99,235,.10)" },
  { id: "violet", name: "Violet", base: "#7C3AED", hover: "#6D28D9", tint: "rgba(124,58,237,.10)" },
  { id: "pink", name: "Pink", base: "#EC4899", hover: "#DB2777", tint: "rgba(236,72,153,.10)" },
  { id: "red", name: "Red", base: "#DC2626", hover: "#B91C1C", tint: "rgba(220,38,38,.10)" },
  { id: "orange", name: "Orange", base: "#EA580C", hover: "#C2410C", tint: "rgba(234,88,12,.10)" },
  {
    id: "emerald",
    name: "Emerald",
    base: "#059669",
    hover: "#047857",
    tint: "rgba(5,150,105,.10)",
  },
  { id: "teal", name: "Teal", base: "#0D9488", hover: "#0F766E", tint: "rgba(13,148,136,.10)" },
  { id: "slate", name: "Slate", base: "#475569", hover: "#334155", tint: "rgba(71,85,105,.10)" },
];

const ThemePicker = ({ themeId, setThemeId }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!e.target.closest(".tpop") && !e.target.closest(".tfab")) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);
  return (
    <>
      <button className="tfab" onClick={() => setOpen(!open)} title="Cor primária">
        <Palette size={20} />
      </button>
      {open && (
        <div className="tpop">
          <div className="tpop-head">
            <Palette size={15} color="var(--primary)" />
            Cor primária
          </div>
          <div className="tpop-sub">
            Experimente paletas para o app. Tudo se atualiza ao vivo — sidebar, topbar, botões,
            badges.
          </div>
          <div className="tgrid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`tswatch${themeId === t.id ? " on" : ""}`}
                style={{ background: t.base }}
                onClick={() => setThemeId(t.id)}
                title={t.name}
              >
                {themeId === t.id && <Check size={18} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const AnalyticsPanel = ({ events, open, setOpen }) => (
  <>
    <button className="afab" onClick={() => setOpen(!open)}>
      <Activity size={17} />
      Analytics<span className="cnt">{events.length}</span>
    </button>
    {open && (
      <div className="apanel">
        <div className="ahead">
          <div className="ra-flex ra-center" style={{ gap: 8 }}>
            <Activity size={16} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Eventos ao vivo</div>
              <div className="muted" style={{ fontSize: 11.5 }}>
                {events.length} disparados nesta sessão
              </div>
            </div>
          </div>
          <button
            className="icon-btn"
            style={{ width: 32, height: 32 }}
            onClick={() => setOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        <div className="alist">
          {events.length === 0 ? (
            <div className="muted" style={{ padding: 24, textAlign: "center", fontSize: 13 }}>
              Navegue para gerar eventos.
            </div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="aev">
                <div className="nm">
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 9,
                      background: `var(--${EV_TONE[e.name] || "muted"})`,
                    }}
                  />
                  {e.name}
                </div>
                <div className="pl">
                  {JSON.stringify(e.payload)} · {e.t}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </>
);

/* ============================== SHELL ============================== */
const NAV = [
  { id: "vehicles", label: "Veículos", icon: Car },
  { id: "mine", label: "Meus Veículos", icon: Package },
  { id: "opportunities", label: "Oportunidades", icon: Flame },
  { id: "leads", label: "Leads", icon: Users },
  { id: "funcionarios", label: "Funcionários", icon: Users },
  { id: "subscription", label: "Assinatura", icon: CreditCard },
  { id: "settings", label: "Configuração", icon: SettingsIcon },
];
const TITLES = {
  vehicles: ["Veículos", "Explore o catálogo e encontre oportunidades"],
  mine: ["Meus Veículos", "Cadastre e gerencie o seu estoque"],
  opportunities: ["Oportunidades", "Veículos abaixo da FIPE detectados pela engine"],
  leads: ["Leads", "Scoring e pipeline de interessados"],
  funcionarios: ["Funcionários", "Cadastre e gerencie sua equipe"],
  subscription: ["Assinatura", "Seu plano e faturamento"],
  settings: ["Configuração", "Preferências da conta"],
};

const Sidebar = ({ active, go, open, close, role, setRole, onLogout }) => {
  const items = NAV.filter((n) => ROLES[role].nav.includes(n.id));
  const R = ROLES[role];
  return (
    <aside className={`sb${open ? " open" : ""}`}>
      <div className="sb-logo" onClick={() => go(items[0]?.id || "vehicles")}>
        <div className="sb-mark">
          <Zap size={21} fill="currentColor" />
        </div>
        <div className="sb-name">
          Radar<b>Auto</b>
        </div>
      </div>
      <div className="sb-body">
        <div className="sb-sec micro">Menu principal</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {items.map((n) => (
            <button
              key={n.id}
              className={`nav-i${active === n.id ? " active" : ""}`}
              onClick={() => go(n.id)}
            >
              <n.icon size={19} strokeWidth={active === n.id ? 2.4 : 2} />
              {n.label}
              <ChevronRight size={15} className="chev" />
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: "16px 4px 12px" }}>
          <div className="micro" style={{ marginBottom: 8 }}>
            Perfil de acesso (demo)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {Object.keys(ROLES).map((k) => {
              const RI = ROLES[k].icon;
              return (
                <button
                  key={k}
                  className={`nav-i${role === k ? " active" : ""}`}
                  onClick={() => setRole(k)}
                  style={{ fontSize: 13 }}
                >
                  <RI size={16} />
                  {ROLES[k].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="sb-user">
        <div className="av">{role === "lojista" ? "FC" : role === "funcionario" ? "FU" : "RV"}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {role === "lojista"
              ? "Flash Car Store"
              : role === "funcionario"
                ? "João Silva"
                : "Auto Center BR"}
          </div>
          <div className="ra-flex ra-center" style={{ gap: 6, marginTop: 2 }}>
            <R.icon size={12} color="var(--muted)" />
            <span className="muted" style={{ fontSize: 12 }}>
              {R.label}
            </span>
          </div>
        </div>
        <button className="iconbtn-sm" title="Sair" onClick={onLogout} style={{ flexShrink: 0 }}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

const fmtAgo = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

const buildNotifications = ({ role, myVehicles, leads, vehicles }) => {
  const out = [];
  const now = Date.now();
  if (role === "lojista") {
    const pending = myVehicles.filter((v) => v.status === "PENDING");
    pending.forEach((v) =>
      out.push({
        id: `pend-${v.id}`,
        icon: Clock,
        tint: "warning",
        title: "Cadastro aguardando aprovação",
        text: `${v.brand} ${v.model} foi enviado por um funcionário`,
        time: now - 1800000,
        nav: "mine",
      }),
    );

    const hotLeads = leads.filter(
      (l) => l.id !== "you" && (l.intent || l.clicks >= 6 || (l.favorited && l.avgTime >= 120)),
    );
    hotLeads.slice(0, 3).forEach((l) => {
      const v =
        myVehicles.find((x) => x.id === l.vehicleId) || VEHICLES.find((x) => x.id === l.vehicleId);
      out.push({
        id: `hot-${l.id}`,
        icon: Flame,
        tint: "trending",
        title: "Lead esquentou",
        text: `${l.name} está muito interessado em ${v ? `${v.brand} ${v.model}` : "um anúncio"}`,
        time: now - 3600000 * 2,
        nav: "leads",
      });
    });

    const expiring = myVehicles.filter(
      (v) => v.status === "ACTIVE" && v.expiresAt && v.expiresAt - now < 7200000,
    );
    expiring.forEach((v) =>
      out.push({
        id: `exp-${v.id}`,
        icon: Clock,
        tint: "danger",
        title: "Anúncio expirando em breve",
        text: `${v.brand} ${v.model} expira em menos de 2h`,
        time: now - 600000,
        nav: "mine",
      }),
    );
  }
  if (role === "funcionario") {
    const mine = myVehicles.filter((v) => v.createdBy === "funcionario");
    mine.forEach((v) => {
      if (v.status === "ACTIVE")
        out.push({
          id: `apv-${v.id}`,
          icon: Check,
          tint: "success",
          title: "Seu cadastro foi aprovado",
          text: `${v.brand} ${v.model} já está publicado`,
          time: now - 7200000,
          nav: "mine",
        });
      else if (v.status === "PENDING")
        out.push({
          id: `wait-${v.id}`,
          icon: Clock,
          tint: "warning",
          title: "Aguardando aprovação",
          text: `${v.brand} ${v.model} ainda em análise pelo lojista`,
          time: now - 1800000,
          nav: "mine",
        });
    });
  }
  if (role === "revendedor") {
    const opps = (vehicles || []).filter((v) => v.diff <= -20).slice(0, 4);
    opps.forEach((v) =>
      out.push({
        id: `opp-${v.id}`,
        icon: Flame,
        tint: "trending",
        title: "Nova oportunidade no radar",
        text: `${v.brand} ${v.model} · ${v.diff}% abaixo da FIPE`,
        time: now - 3600000 * 3,
        nav: "opportunities",
      }),
    );
  }
  return out.sort((a, b) => b.time - a.time);
};

const NotifPanel = ({ items, onClose, onNav, readIds, markAllRead }) => (
  <div className="notif-pop" onClick={(e) => e.stopPropagation()}>
    <div className="notif-head">
      <div>
        <div className="display" style={{ fontWeight: 700, fontSize: 15 }}>
          Notificações
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          {items.length === 0
            ? "Tudo em dia"
            : `${items.length} ${items.length === 1 ? "atualização" : "atualizações"}`}
        </div>
      </div>
      {items.length > 0 && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: "6px 10px", fontSize: 12 }}
          onClick={markAllRead}
        >
          Marcar como lidas
        </button>
      )}
    </div>
    <div className="notif-body">
      {items.length === 0 ? (
        <div className="notif-empty">
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "var(--success-t)",
              color: "var(--success)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Check size={24} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>Nada por aqui</div>
          <div style={{ fontSize: 12.5 }}>
            Você verá alertas sobre seus cadastros, leads e oportunidades.
          </div>
        </div>
      ) : (
        items.map((n) => {
          const Icon = n.icon;
          const unread = !readIds.has(n.id);
          return (
            <button
              key={n.id}
              className="notif-item"
              onClick={() => {
                onNav(n.nav);
                onClose();
              }}
            >
              <div
                className="notif-icon"
                style={{ background: `var(--${n.tint}-t)`, color: `var(--${n.tint})` }}
              >
                <Icon size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ni-row">
                  <span className="ni-title">{n.title}</span>
                  {unread && <span className="ni-dot" />}
                </div>
                <div className="ni-text">{n.text}</div>
                <div className="ni-time">{fmtAgo(n.time)}</div>
              </div>
            </button>
          );
        })
      )}
    </div>
  </div>
);

const UserMenu = ({ role, open, setOpen, onGoSettings, onLogout, hasSettings }) => {
  const initials = role === "lojista" ? "FC" : role === "funcionario" ? "JS" : "AC";
  const name =
    role === "lojista"
      ? "Flash Car Store"
      : role === "funcionario"
        ? "João Silva"
        : "Auto Center BR";
  const RI = ROLES[role].icon;
  return (
    <div className="usr-wrap">
      <button className="usr-btn" onClick={() => setOpen(!open)}>
        <div className="av">{initials}</div>
        <span className="usr-name hide-sm">{name}</span>
        <ChevronDown size={14} color="rgba(255,255,255,.8)" />
      </button>
      {open && (
        <div className="usr-pop" onClick={(e) => e.stopPropagation()}>
          <div className="usr-pop-head">
            <div className="av">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
              <div className="ra-flex ra-center" style={{ gap: 5, marginTop: 2 }}>
                <RI size={11} color="var(--muted)" />
                <span className="muted" style={{ fontSize: 12 }}>
                  {ROLES[role].label}
                </span>
              </div>
            </div>
          </div>
          {hasSettings && (
            <button
              className="usr-pop-item"
              onClick={() => {
                onGoSettings();
                setOpen(false);
              }}
            >
              <SettingsIcon size={16} color="var(--muted)" />
              Configuração
            </button>
          )}
          <button
            className="usr-pop-item danger"
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
};

const Topbar = ({
  onMenu,
  mode,
  title,
  subtitle,
  q,
  setQ,
  premium,
  setPremium,
  onBack,
  backLabel = "Catálogo",
  notifs,
  notifOpen,
  setNotifOpen,
  onNotifNav,
  readIds,
  markAllRead,
  role,
  userOpen,
  setUserOpen,
  onGoSettings,
  onLogout,
  hasSettings,
}) => (
  <header className="top">
    <button className="icon-btn menu-btn" onClick={onMenu}>
      <Menu size={20} />
    </button>
    {mode === "detail" || mode === "page" ? (
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: "8px 12px" }}>
        <ArrowLeft size={16} />
        {backLabel}
      </button>
    ) : (
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 className="display">{title}</h1>
        <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
    )}
    {(mode === "detail" || mode === "page") && <div style={{ flex: 1 }} />}
    {mode === "marketplace" && (
      <div className="search top-search">
        <Search size={17} />
        <input
          className="inp"
          placeholder="Buscar marca, modelo..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
    )}
    <div className="ra-flex ra-center" style={{ gap: 8 }}>
      <span className="micro hide-sm">Plano</span>
      <div className="seg">
        <button className={!premium ? "on" : ""} onClick={() => setPremium(false)}>
          Free
        </button>
        <button className={premium ? "on prem" : ""} onClick={() => setPremium(true)}>
          <Crown size={14} />
          Premium
        </button>
      </div>
    </div>
    <div className="notif-wrap">
      <button className="icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
        <Bell size={19} />
        {notifs.some((n) => !readIds.has(n.id)) && <span className="badge-dot" />}
      </button>
      {notifOpen && (
        <NotifPanel
          items={notifs}
          onClose={() => setNotifOpen(false)}
          onNav={onNotifNav}
          readIds={readIds}
          markAllRead={markAllRead}
        />
      )}
    </div>
  </header>
);

const Placeholder = ({ id }) => (
  <div
    style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 24,
      padding: "64px 32px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
    }}
  >
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: 16,
        background: "var(--primary-t)",
        color: "var(--primary)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Zap size={28} />
    </div>
    <div className="display" style={{ fontSize: 20, fontWeight: 700 }}>
      {TITLES[id][0]}
    </div>
    <div className="muted" style={{ fontSize: 14, maxWidth: 360 }}>
      Este módulo entra nos próximos slices. Volte para “Veículos” para navegar o catálogo e os
      detalhes.
    </div>
  </div>
);

/* ============================== SUBSCRIPTION / PLANOS ============================== */
const brlc = (n) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PRICING = {
  monthly: {
    perMonth: 49.9,
    billed: 49.9,
    cycleNote: "Cobrado mensalmente",
    save: 0,
    savePerYear: 0,
    label: "Mensal",
    c1: "#475569",
    c2: "#64748B",
    accent: "#475569",
  },
  quarterly: {
    perMonth: 39.9,
    billed: 119.7,
    cycleNote: "R$ 119,70 a cada 3 meses",
    save: 20,
    savePerYear: 120,
    label: "Trimestral",
    c1: "#1D4ED8",
    c2: "#3b82f6",
    accent: "#2563EB",
  },
  yearly: {
    perMonth: 29.9,
    billed: 358.8,
    cycleNote: "R$ 358,80 por ano",
    save: 40,
    savePerYear: 240,
    label: "Anual",
    c1: "#EA580C",
    c2: "#FF6B00",
    accent: "#FF6B00",
  },
};
const CYCLES = ["monthly", "quarterly", "yearly"];
const PREMIUM_FEATURES = [
  "Contato e WhatsApp liberados",
  "Galeria completa de fotos",
  "Insights e ranking do anúncio",
  "Radar de Oportunidades",
  "Alertas + suporte prioritário",
];

const PlanCard = ({ k, premium, activeCycle, onChoose }) => {
  const p = PRICING[k];
  const hl = k === "quarterly";
  const isActive = premium && activeCycle === k;
  return (
    <div className={`pc${hl ? " pc-hl" : ""}`}>
      <div className="pc-head" style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}>
        <div className="pc-wave" />
        {hl && <div className="pc-pop">★ Mais popular</div>}
        <div className="pc-name">{p.label}</div>
      </div>
      <div className="pc-body">
        <div className="pc-price">
          R$ {brlc(p.perMonth)}
          <small>/mês</small>
        </div>
        <div className="pc-underline" style={{ background: p.accent }} />
        <div className="pc-note">{p.cycleNote}</div>
        {p.save > 0 ? (
          <span className="save-bdg" style={{ fontSize: 11.5, padding: "4px 10px" }}>
            −{p.save}% · economize R$ {brlc(p.savePerYear)}/ano
          </span>
        ) : (
          <span className="muted" style={{ fontSize: 11.5, fontWeight: 600 }}>
            Flexível, sem fidelidade
          </span>
        )}
        <div className="pc-feats">
          {PREMIUM_FEATURES.map((t) => (
            <div key={t} className="pc-feat">
              <Check size={16} className="ck" />
              {t}
            </div>
          ))}
        </div>
        <button
          className="btn pc-btn"
          disabled={isActive}
          style={
            isActive
              ? { background: "var(--bg-2)", color: "var(--muted)", cursor: "default" }
              : { background: p.accent, color: "#fff" }
          }
          onClick={isActive ? undefined : () => onChoose(k)}
        >
          {isActive ? "Plano atual" : premium ? "Trocar para este" : "Assinar"}
        </button>
      </div>
    </div>
  );
};

const Subscription = ({ premium, activeCycle, track, onSubscribe, onCancel, goCatalog }) => {
  const [checkoutCycle, setCheckoutCycle] = useState(null);
  const [modal, setModal] = useState(null);
  const p = checkoutCycle ? PRICING[checkoutCycle] : null;
  const choose = (k) => {
    setCheckoutCycle(k);
    track("checkout_started", { cycle: k, plan: `PREMIUM_${k.toUpperCase()}` });
    setModal("checkout");
  };
  const confirm = () => {
    onSubscribe(checkoutCycle);
    setModal("success");
  };

  return (
    <>
      <div
        className="card card-p"
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            display: "grid",
            placeItems: "center",
            background: premium ? "var(--trending-t)" : "var(--muted-t)",
            color: premium ? "var(--trending)" : "var(--muted)",
          }}
        >
          {premium ? <Crown size={22} /> : <Zap size={22} />}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div className="micro">Plano atual</div>
          <div className="display" style={{ fontWeight: 700, fontSize: 18 }}>
            {premium
              ? `RadarAuto Premium${activeCycle && PRICING[activeCycle] ? " · " + PRICING[activeCycle].label : ""}`
              : "RadarAuto Free"}
          </div>
        </div>
        {premium ? (
          <button className="btn btn-secondary btn-sm" onClick={() => setModal("cancel")}>
            Gerenciar / Cancelar
          </button>
        ) : (
          <Badge tone="trending" icon={Crown}>
            Faça upgrade e desbloqueie tudo
          </Badge>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2 className="display" style={{ fontSize: 20, fontWeight: 700 }}>
          Escolha seu plano Premium
        </h2>
        <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>
          Mesmos benefícios — quanto maior o ciclo, maior o desconto. Cancele quando quiser.
        </div>
      </div>

      <div className="pricing-row">
        {CYCLES.map((k) => (
          <PlanCard key={k} k={k} premium={premium} activeCycle={activeCycle} onChoose={choose} />
        ))}
      </div>

      <div
        className="muted"
        style={{ fontSize: 12, marginTop: 20, display: "flex", gap: 7, maxWidth: 980 }}
      >
        <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
        Pagamento processado via Stripe (simulado nesta fase). A assinatura é validada
        exclusivamente no backend — o frontend nunca decide o estado de pagamento.
      </div>

      {modal === "checkout" && p && (
        <div className="ov" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="ra-flex ra-between ra-center" style={{ marginBottom: 18 }}>
              <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>
                Assinar Premium
              </div>
              <button
                className="icon-btn"
                style={{ width: 34, height: 34 }}
                onClick={() => setModal(null)}
              >
                <X size={17} />
              </button>
            </div>
            <div
              style={{ background: "var(--bg-2)", borderRadius: 14, padding: 16, marginBottom: 18 }}
            >
              <div className="sumrow">
                <span className="muted">Plano</span>
                <span style={{ fontWeight: 600 }}>Premium {p.label}</span>
              </div>
              <div className="sumrow">
                <span className="muted">Valor por mês</span>
                <span style={{ fontWeight: 600 }}>R$ {brlc(p.perMonth)}</span>
              </div>
              {p.save > 0 && (
                <div className="sumrow">
                  <span className="muted">Desconto</span>
                  <span style={{ fontWeight: 600, color: "var(--success)" }}>-{p.save}%</span>
                </div>
              )}
              <div
                className="sumrow"
                style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 12 }}
              >
                <span style={{ fontWeight: 600 }}>Total hoje</span>
                <span className="num" style={{ fontSize: 18 }}>
                  R$ {brlc(p.billed)}
                </span>
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                {p.cycleNote}
              </div>
            </div>
            <div className="lbl">Pagamento</div>
            <div className="cardbox" style={{ marginBottom: 8 }}>
              <CreditCard size={18} />
              •••• •••• •••• 4242<span style={{ marginLeft: "auto" }}>12/29</span>
            </div>
            <div
              className="muted"
              style={{ fontSize: 11.5, marginBottom: 18, display: "flex", gap: 6 }}
            >
              <Lock size={13} />
              Checkout simulado — Stripe Elements entra na Fase 2.
            </div>
            <button className="btn btn-trending btn-block" onClick={confirm}>
              <Crown size={16} />
              Confirmar e assinar
            </button>
          </div>
        </div>
      )}

      {modal === "success" && (
        <div className="ov" onClick={() => setModal(null)}>
          <div
            className="modal"
            style={{ textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 18,
                background: "var(--success-t)",
                color: "var(--success)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <Check size={30} />
            </div>
            <div className="display" style={{ fontSize: 21, fontWeight: 700 }}>
              Bem-vindo ao Premium! 🎉
            </div>
            <div className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
              Contatos, galeria completa e insights já estão desbloqueados em todos os anúncios.
            </div>
            <div className="ra-flex" style={{ gap: 10, marginTop: 24 }}>
              <button className="btn btn-secondary btn-block" onClick={() => setModal(null)}>
                Fechar
              </button>
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  setModal(null);
                  goCatalog();
                }}
              >
                Ver veículos
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "cancel" && (
        <div className="ov" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>
              Cancelar Premium?
            </div>
            <div className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
              Você volta para o plano Free e perde acesso a contatos, galeria completa e insights.
              Pode reativar quando quiser.
            </div>
            <div className="ra-flex" style={{ gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>
                Manter Premium
              </button>
              <button
                className="btn"
                style={{ background: "var(--danger-t)", color: "var(--danger)" }}
                onClick={() => {
                  onCancel();
                  setModal(null);
                }}
              >
                Cancelar assinatura
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ============================== OPORTUNIDADES ============================== */
const eco = (v) => v.fipe - v.price;
const THRS = [
  { v: 0, l: "Abaixo da FIPE" },
  { v: 10, l: "10%+" },
  { v: 20, l: "20%+" },
  { v: 30, l: "30%+" },
];

const OStat = ({ icon: Icon, tint, label, value, sub }) => (
  <div className="ostat">
    <div className="ic" style={{ background: `var(--${tint}-t)`, color: `var(--${tint})` }}>
      <Icon size={18} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div className="micro">{label}</div>
      <div className="num" style={{ fontSize: 21, lineHeight: 1.15, marginTop: 2 }}>
        {value}
      </div>
      {sub && (
        <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  </div>
);

const Opportunities = ({ onOpen }) => {
  const [thr, setThr] = useState(10);
  const all = useMemo(() => VEHICLES.filter((v) => v.diff < 0).sort((a, b) => a.diff - b.diff), []);
  const opps = useMemo(() => all.filter((v) => Math.abs(v.diff) >= thr), [all, thr]);
  const maxAbs = Math.abs(all[0]?.diff || 1);
  const stats = useMemo(() => {
    const count = opps.length;
    const best = count ? Math.min(...opps.map((v) => v.diff)) : 0;
    const totalEco = opps.reduce((s, v) => s + eco(v), 0);
    const avgEco = count ? Math.round(totalEco / count) : 0;
    return { count, best, totalEco, avgEco };
  }, [opps]);
  const hero = opps[0];
  const rest = opps.slice(1);

  return (
    <>
      <div className="opp-stats">
        <OStat
          icon={Flame}
          tint="trending"
          label="Oportunidades"
          value={stats.count}
          sub={thr === 0 ? "abaixo da FIPE" : `${thr}%+ de desconto`}
        />
        <OStat
          icon={TrendingDown}
          tint="success"
          label="Maior desconto"
          value={`${stats.best}%`}
          sub="abaixo da tabela"
        />
        <OStat
          icon={DollarSign}
          tint="primary"
          label="Economia média"
          value={`R$ ${brl(stats.avgEco)}`}
          sub="por veículo"
        />
        <OStat
          icon={BarChart3}
          tint="warning"
          label="Economia total"
          value={`R$ ${brl(stats.totalEco)}`}
          sub="disponível agora"
        />
      </div>

      <div className="ra-flex ra-between ra-center ra-wrap" style={{ gap: 12, marginBottom: 18 }}>
        <div style={{ maxWidth: 520 }}>
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
            A engine cruza o preço de cada anúncio com a tabela FIPE e ranqueia os maiores descontos
            em tempo real.
          </div>
        </div>
        <div className="seg">
          {THRS.map((t) => (
            <button key={t.v} className={thr === t.v ? "on" : ""} onClick={() => setThr(t.v)}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {!hero ? (
        <EmptyState
          icon={Flame}
          title="Nenhuma oportunidade nesse filtro"
          desc="O Radar não encontrou veículos com o desconto mínimo selecionado. Reduza o percentual para ver mais achados ou aguarde novos cadastros."
          action={{
            label: "Ver todos abaixo da FIPE",
            icon: TrendingDown,
            onClick: () => setThr(0),
          }}
        />
      ) : (
        <>
          {/* HERO */}
          <div className="ohero">
            <div
              className="ohero-img"
              onClick={() => onOpen(hero.id, "opportunity")}
              style={{ cursor: "pointer" }}
            >
              <Car size={48} strokeWidth={1.3} />
              <div style={{ position: "absolute", top: 10, left: 10 }}>
                <Badge tone="trending" icon={Zap}>
                  #1 do radar
                </Badge>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <Badge tone="trending" icon={Flame}>
                Oportunidade destaque
              </Badge>
              <h2 className="display" style={{ fontSize: 24, fontWeight: 700, marginTop: 10 }}>
                {hero.brand} {hero.model}
              </h2>
              <div className="muted" style={{ fontSize: 13.5, marginTop: 2 }}>
                {hero.version}
              </div>
              <div className="ra-flex ra-wrap ra-center" style={{ gap: 14, marginTop: 10 }}>
                <span className="spec">
                  <Calendar size={14} />
                  {hero.year}
                </span>
                <span className="spec">
                  <Gauge size={14} />
                  {brl(hero.km)} km
                </span>
                <span className="spec">
                  <MapPin size={14} />
                  {hero.city}
                </span>
              </div>
              <div className="ra-flex ra-wrap ra-center" style={{ gap: 18, marginTop: 16 }}>
                <div>
                  <div className="num" style={{ fontSize: 28 }}>
                    R$ {brl(hero.price)}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    FIPE R$ {brl(hero.fipe)}
                  </div>
                </div>
                <div>
                  <div className="num" style={{ fontSize: 28, color: "var(--trending)" }}>
                    {hero.diff}%
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    economia R$ {brl(eco(hero))}
                  </div>
                </div>
                <button
                  className="btn btn-trending"
                  onClick={() => onOpen(hero.id, "opportunity")}
                  style={{ marginLeft: "auto" }}
                >
                  <Eye size={16} />
                  Ver veículo
                </button>
              </div>
            </div>
          </div>

          {/* RANKING */}
          {rest.length > 0 && (
            <div className="micro" style={{ marginBottom: 12 }}>
              Ranking de oportunidades
            </div>
          )}
          <div className="opp-list">
            {rest.map((v, i) => (
              <div key={v.id} className="oitem" onClick={() => onOpen(v.id, "opportunity")}>
                <div className="orank">{i + 2}</div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div className="ra-flex ra-center" style={{ gap: 8, flexWrap: "wrap" }}>
                    <span className="display" style={{ fontWeight: 700, fontSize: 15.5 }}>
                      {v.brand} {v.model}
                    </span>
                    <span
                      className="score"
                      style={{
                        background: `var(--${scoreTone(v.score)}-t)`,
                        color: `var(--${scoreTone(v.score)})`,
                      }}
                    >
                      <Zap size={11} fill="currentColor" />
                      {v.score}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                    {yearLabel(v)} · {brl(v.km)} km · {v.city}
                  </div>
                  <div className="obar">
                    <span style={{ width: `${Math.round((Math.abs(v.diff) / maxAbs) * 100)}%` }} />
                  </div>
                </div>
                <div className="hide-sm" style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="num" style={{ fontSize: 16 }}>
                    R$ {brl(v.price)}
                  </div>
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    FIPE R$ {brl(v.fipe)}
                  </div>
                </div>
                <div className="opct">
                  <div className="big">{v.diff}%</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    −R$ {brl(eco(v))}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(v.id, "opportunity");
                  }}
                >
                  <Eye size={15} />
                  Ver
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

/* ============================== MEUS VEÍCULOS (LOJISTA) ============================== */
const MSTATUS = {
  ACTIVE: ["success", "Ativo"],
  INACTIVE: ["muted", "Inativo"],
  SOLD: ["primary", "Vendido"],
  EXPIRED: ["warning", "Expirado"],
  PENDING: ["warning", "Aguardando aprovação"],
};
const ROLES = {
  lojista: {
    label: "Lojista",
    desc: "Dono — acesso total e aprova cadastros",
    icon: Crown,
    nav: ["vehicles", "mine", "opportunities", "leads", "funcionarios", "subscription", "settings"],
  },
  funcionario: {
    label: "Funcionário",
    desc: "Cadastra veículos — precisam de aprovação",
    icon: Users,
    nav: ["mine", "leads"],
  },
  revendedor: {
    label: "Revendedor",
    desc: "Comprador — busca veículos e oportunidades",
    icon: Search,
    nav: ["vehicles", "opportunities", "subscription", "settings"],
  },
};
const canManageVehicles = (role) => role === "lojista" || role === "funcionario";
const autoApproves = (role) => role === "lojista";
const HOT_VIEWS = 1300;
const isHot = (v) => (v.views || 0) >= HOT_VIEWS;
const LISTING_MS = 24 * 60 * 60 * 1000;

const fmtDur = (ms) => {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(sec)}`;
};

const Countdown = ({ expiresAt, onExpire }) => {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = expiresAt - now;
  useEffect(() => {
    if (left <= 0 && !fired.current) {
      fired.current = true;
      onExpire && onExpire();
    }
  }, [left]);
  const col =
    left <= 0 ? "var(--danger)" : left <= 2 * 3600 * 1000 ? "var(--warning)" : "var(--text)";
  return (
    <span className="cd-chip">
      <Clock size={13} style={{ color: col }} />
      <span className="muted" style={{ fontWeight: 500 }}>
        Expira em
      </span>
      <b style={{ color: col, fontFamily: "var(--display)", fontVariantNumeric: "tabular-nums" }}>
        {left <= 0 ? "Expirado" : fmtDur(left)}
      </b>
    </span>
  );
};
/* ============================== UPLOAD + CROP ============================== */
const CROP_RATIO = 4 / 3;
const CROP_OUT_W = 800;
const CROP_OUT_H = Math.round(CROP_OUT_W / CROP_RATIO);

const imgsOf = (v) => (v.photos && v.photos.length) || v.imgs || 0;
const photoAt = (v, i) => (v.photos && v.photos[i]) || null;

const ImageCropper = ({ src, onCancel, onApply }) => {
  const containerRef = useRef(null);
  const [imgSize, setImgSize] = useState(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);

  useEffect(() => {
    const update = () => {
      const c = containerRef.current;
      if (!c) return;
      const maxW = Math.min(c.parentElement.clientWidth - 4, 560);
      const w = Math.floor(maxW);
      const h = Math.round(w / CROP_RATIO);
      setContainerSize({ w, h });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!imgSize || !containerSize.w) return;
    const min = Math.max(containerSize.w / imgSize.w, containerSize.h / imgSize.h);
    setMinScale(min);
    setScale(min);
    setPos({
      x: (containerSize.w - imgSize.w * min) / 2,
      y: (containerSize.h - imgSize.h * min) / 2,
    });
  }, [imgSize, containerSize]);

  const constrain = (p, s) => {
    if (!imgSize) return p;
    const iw = imgSize.w * s,
      ih = imgSize.h * s;
    return {
      x: Math.max(containerSize.w - iw, Math.min(0, p.x)),
      y: Math.max(containerSize.h - ih, Math.min(0, p.y)),
    };
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const pt = e.touches ? e.touches[0] : e;
    dragStart.current = { x: pt.clientX - pos.x, y: pt.clientY - pos.y };
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    if (e.touches) e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    setPos(
      constrain(
        { x: pt.clientX - dragStart.current.x, y: pt.clientY - dragStart.current.y },
        scale,
      ),
    );
  };
  const onPointerUp = () => setDragging(false);

  const onZoom = (e) => {
    const newScale = parseFloat(e.target.value);
    const cx = containerSize.w / 2,
      cy = containerSize.h / 2;
    const newPos = {
      x: cx - (cx - pos.x) * (newScale / scale),
      y: cy - (cy - pos.y) * (newScale / scale),
    };
    setScale(newScale);
    setPos(constrain(newPos, newScale));
  };

  const apply = () => {
    const canvas = document.createElement("canvas");
    canvas.width = CROP_OUT_W;
    canvas.height = CROP_OUT_H;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      const sx = -pos.x / scale,
        sy = -pos.y / scale;
      const sw = containerSize.w / scale,
        sh = containerSize.h / scale;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CROP_OUT_W, CROP_OUT_H);
      onApply(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = src;
  };

  return (
    <div className="ov" onClick={onCancel}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, padding: 22 }}
      >
        <div style={{ marginBottom: 16 }}>
          <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>
            Ajustar foto
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            Arraste pra reposicionar e use o slider pra dar zoom. A imagem será cortada no formato
            4:3.
          </div>
        </div>
        <div
          ref={containerRef}
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <div
            style={{
              width: containerSize.w,
              height: containerSize.h,
              background: "#0f172a",
              borderRadius: 14,
              overflow: "hidden",
              position: "relative",
              cursor: dragging ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
            }}
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          >
            {imgSize && (
              <img
                src={src}
                draggable={false}
                alt=""
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: imgSize.w * scale,
                  height: imgSize.h * scale,
                  pointerEvents: "none",
                  maxWidth: "none",
                }}
              />
            )}
          </div>
        </div>
        {imgSize && (
          <div className="ra-flex ra-center" style={{ gap: 14, marginTop: 16 }}>
            <ZoomOut size={18} color="var(--muted)" />
            <input
              type="range"
              min={minScale}
              max={minScale * 4}
              step={minScale * 0.03}
              value={scale}
              onChange={onZoom}
              style={{ flex: 1, accentColor: "var(--primary)" }}
            />
            <ZoomIn size={18} color="var(--muted)" />
          </div>
        )}
        <div className="ra-flex" style={{ gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={apply} disabled={!imgSize}>
            <Check size={16} />
            Aplicar corte
          </button>
        </div>
      </div>
    </div>
  );
};

const MFORM_BLANK = {
  brand: "",
  model: "",
  version: "",
  year: "",
  yearModel: "",
  cat: "",
  fuel: "",
  color: "",
  plate: "",
  fipe: "",
  price: "",
  km: "",
  transm: "Manual",
  obs: "",
  delivery: false,
  optionals: [],
  photos: [],
  state: "",
  city: "",
};

/* Modelos por marca — base local (mock). No backend vem da Tabela FIPE (marca → modelo → ano → preço). */
const MODELS = {
  BMW: ["Série 1", "118i", "320i", "320i Sport", "328i", "Série 3", "X1", "X3", "X5", "530i", "M3"],
  CHEVROLET: [
    "Onix",
    "Onix Plus",
    "Tracker",
    "Cruze",
    "Cruze Sport6",
    "S10",
    "Spin",
    "Montana",
    "Prisma",
    "Joy",
  ],
  FIAT: [
    "500",
    "Argo",
    "Cronos",
    "Mobi",
    "Toro",
    "Strada",
    "Pulse",
    "Fastback",
    "Uno",
    "Palio",
    "Punto",
  ],
  FORD: ["Ka", "Ka Sedan", "EcoSport", "Ranger", "Fiesta", "Focus", "Territory", "Edge"],
  HONDA: ["Civic", "City", "Fit", "HR-V", "WR-V", "CR-V", "Accord"],
  HYUNDAI: ["HB20", "HB20S", "Creta", "Tucson", "ix35", "Santa Fe", "Azera", "i30"],
  JEEP: ["Renegade", "Compass", "Commander", "Cherokee", "Wrangler"],
  RENAULT: ["Kwid", "Sandero", "Logan", "Duster", "Captur", "Oroch", "Stepway", "Clio"],
  TOYOTA: ["Corolla", "Corolla Cross", "Yaris", "Hilux", "Etios", "RAV4", "SW4"],
  VW: ["Gol", "Polo", "Virtus", "T-Cross", "Nivus", "Saveiro", "Jetta", "Golf", "Voyage", "Up"],
  VOLKSWAGEN: [
    "Gol",
    "Polo",
    "Virtus",
    "T-Cross",
    "Nivus",
    "Saveiro",
    "Jetta",
    "Golf",
    "Voyage",
    "Up",
  ],
};
const modelsFor = (brand) => MODELS[(brand || "").toUpperCase()] || [];

const VERSIONS_GENERIC = [
  "1.0 Flex Manual",
  "1.0 Turbo Flex Aut.",
  "1.4 Flex",
  "1.6 Flex Aut.",
  "2.0 Flex Aut.",
  "2.0 Turbo Aut.",
  "Sport",
  "Premium",
];
const VERSIONS = {
  "320I": ["2.0 Sport GP Active Flex Aut.", "2.0 M Sport Aut.", "2.0 Turbo Aut."],
  X1: ["sDrive20i GP Active Flex Aut.", "xDrive25i Sport Aut."],
  ONIX: ["1.0 Flex Manual", "1.0 Turbo LT Aut.", "1.0 Turbo LTZ Aut."],
  "ONIX PLUS": ["1.0 Turbo LT Aut.", "1.0 Turbo Premier Aut."],
  500: ["1.4 Flex 8V Evo Mec.", "1.4 Cult Flex", "1.4 Sport Aut."],
  ARGO: ["1.0 Flex Manual", "1.3 Drive Flex", "1.8 HGT Aut."],
  TORO: ["1.8 Freedom Flex Aut.", "1.3 Turbo Flex Aut.", "2.0 Volcano 4x4 Diesel Aut."],
  HB20: ["1.0 Sense Flex", "1.0 Vision Flex", "1.0 Turbo Platinum Aut."],
  CRETA: ["1.0 Turbo Comfort Aut.", "1.6 Action Aut.", "2.0 Prestige Aut."],
  COMPASS: ["1.3 Turbo Longitude Aut.", "2.0 Sport Flex Aut.", "2.0 Limited Diesel 4x4 Aut."],
  RENEGADE: ["1.3 Turbo Longitude Aut.", "1.8 Flex Aut.", "2.0 Diesel 4x4 Aut."],
  COROLLA: ["1.8 GLi Flex Aut.", "2.0 XEI Flex Aut.", "2.0 Altis Premium Hybrid Aut."],
  HILUX: ["2.7 SR Flex Aut.", "2.8 SRX 4x4 Diesel Aut."],
  CIVIC: ["2.0 EXL Flex Aut.", "1.5 Touring Turbo Aut."],
  CITY: ["1.5 EXL Flex Aut.", "1.5 Touring Aut."],
  "HR-V": ["1.8 EXL Flex Aut.", "1.5 Touring Turbo Aut."],
  GOL: ["1.0 Flex Manual", "1.6 Comfortline Flex"],
  POLO: ["1.0 Flex Manual", "1.0 TSI Highline Aut.", "200 TSI Aut."],
  VIRTUS: ["1.0 TSI Comfortline Aut.", "1.6 MSI Flex Aut.", "200 TSI Highline Aut."],
  "T-CROSS": ["1.0 TSI Flex Aut.", "1.4 TSI Highline Aut."],
  GOLF: ["1.0 TSI Aut.", "1.4 TSI Comfortline Aut."],
  JETTA: ["1.4 TSI Comfortline Aut.", "350 TSI GLI Aut."],
  KWID: ["1.0 Zen Flex", "1.0 Intense Flex"],
  SANDERO: ["1.0 Flex Manual", "1.6 Stepway Aut."],
  DUSTER: ["1.6 Flex Manual", "1.3 Turbo Iconic Aut."],
  ECOSPORT: ["1.5 SE Flex Aut.", "2.0 Titanium Aut."],
  RANGER: ["2.0 XLT 4x4 Diesel Aut.", "3.2 Limited 4x4 Diesel Aut."],
  KA: ["1.0 SE Flex", "1.5 SEL Aut."],
  TRACKER: ["1.0 Turbo LT Aut.", "1.2 Turbo Premier Aut."],
  CRUZE: ["1.4 Turbo LT Aut.", "1.4 Turbo LTZ Aut."],
  STRADA: ["1.4 Endurance Flex", "1.3 Volcano Flex Aut."],
  PULSE: ["1.0 Drive Flex", "1.0 Turbo Audace Aut."],
};
const versionsFor = (model) => (model ? VERSIONS[model.toUpperCase()] || VERSIONS_GENERIC : []);

/* Valor FIPE de referência por modelo (mock). No backend vem da Tabela FIPE conforme modelo + ano. */
const FIPE_BASE = {
  "SÉRIE 1": 200000,
  "118I": 205000,
  "320I": 235000,
  "328I": 185000,
  "SÉRIE 3": 245000,
  X1: 285000,
  X3: 380000,
  X5: 600000,
  "530I": 420000,
  M3: 650000,
  ONIX: 88000,
  "ONIX PLUS": 98000,
  TRACKER: 132000,
  CRUZE: 135000,
  S10: 235000,
  SPIN: 112000,
  MONTANA: 122000,
  PRISMA: 72000,
  JOY: 66000,
  500: 72000,
  ARGO: 82000,
  CRONOS: 92000,
  MOBI: 70000,
  TORO: 162000,
  STRADA: 112000,
  PULSE: 112000,
  FASTBACK: 142000,
  UNO: 56000,
  PALIO: 46000,
  PUNTO: 52000,
  KA: 62000,
  "KA SEDAN": 66000,
  ECOSPORT: 96000,
  RANGER: 285000,
  FIESTA: 60000,
  FOCUS: 90000,
  TERRITORY: 182000,
  EDGE: 200000,
  CIVIC: 182000,
  CITY: 122000,
  FIT: 96000,
  "HR-V": 162000,
  "WR-V": 112000,
  "CR-V": 252000,
  ACCORD: 282000,
  HB20: 82000,
  HB20S: 92000,
  CRETA: 142000,
  TUCSON: 182000,
  IX35: 112000,
  "SANTA FE": 252000,
  AZERA: 152000,
  I30: 112000,
  RENEGADE: 132000,
  COMPASS: 182000,
  COMMANDER: 252000,
  CHEROKEE: 222000,
  WRANGLER: 400000,
  KWID: 72000,
  SANDERO: 82000,
  LOGAN: 86000,
  DUSTER: 122000,
  CAPTUR: 132000,
  OROCH: 132000,
  STEPWAY: 92000,
  CLIO: 52000,
  COROLLA: 162000,
  "COROLLA CROSS": 192000,
  YARIS: 112000,
  HILUX: 285000,
  ETIOS: 72000,
  RAV4: 300000,
  SW4: 350000,
  GOL: 66000,
  POLO: 96000,
  VIRTUS: 112000,
  "T-CROSS": 142000,
  NIVUS: 142000,
  SAVEIRO: 102000,
  JETTA: 162000,
  GOLF: 122000,
  VOYAGE: 72000,
  UP: 62000,
};
const CAT_FIPE = { Hatch: 78000, Sedan: 112000, SUV: 152000, Caminhonete: 175000 };
const fipeFor = (model, year, cat) => {
  const base = FIPE_BASE[(model || "").toUpperCase()] || CAT_FIPE[cat] || 90000;
  const ny = new Date().getFullYear();
  const old = Math.max(0, ny - (year || ny));
  return Math.round((base * Math.pow(0.93, old)) / 500) * 500;
};

const RADAR_TARGET = -10;
const recommendPrice = (form) => {
  const fp = fipeFor(form.model, +form.year, form.cat);
  if (!fp) return null;
  const sameModel = VEHICLES.filter(
    (v) =>
      (v.brand || "").toUpperCase() === (form.brand || "").toUpperCase() &&
      (v.model || "").toUpperCase() === (form.model || "").toUpperCase() &&
      v.fipe > 0,
  );
  const sameCat = VEHICLES.filter((v) => v.cat === form.cat && v.fipe > 0);
  let compDiff = null,
    source = "default",
    n = 0;
  if (sameModel.length >= 2) {
    compDiff = sameModel.reduce((s, v) => s + v.diff, 0) / sameModel.length;
    source = "model";
    n = sameModel.length;
  } else if (sameCat.length >= 3) {
    compDiff = sameCat.reduce((s, v) => s + v.diff, 0) / sameCat.length;
    source = "cat";
    n = sameCat.length;
  }
  const finalDiff =
    compDiff != null ? Math.round(0.7 * compDiff + 0.3 * RADAR_TARGET) : RADAR_TARGET;
  return {
    price: Math.round((fp * (1 + finalDiff / 100)) / 100) * 100,
    diff: finalDiff,
    source,
    n,
  };
};

const MODEL_CAT = {
  "SÉRIE 1": "Hatch",
  "118I": "Hatch",
  "320I": "Sedan",
  "328I": "Sedan",
  "SÉRIE 3": "Sedan",
  "530I": "Sedan",
  M3: "Sedan",
  X1: "SUV",
  X3: "SUV",
  X5: "SUV",
  ONIX: "Hatch",
  "ONIX PLUS": "Sedan",
  TRACKER: "SUV",
  CRUZE: "Sedan",
  S10: "Caminhonete",
  SPIN: "SUV",
  MONTANA: "Caminhonete",
  PRISMA: "Sedan",
  JOY: "Hatch",
  500: "Hatch",
  ARGO: "Hatch",
  CRONOS: "Sedan",
  MOBI: "Hatch",
  TORO: "Caminhonete",
  STRADA: "Caminhonete",
  PULSE: "SUV",
  FASTBACK: "SUV",
  UNO: "Hatch",
  PALIO: "Hatch",
  PUNTO: "Hatch",
  KA: "Hatch",
  "KA SEDAN": "Sedan",
  ECOSPORT: "SUV",
  RANGER: "Caminhonete",
  FIESTA: "Hatch",
  FOCUS: "Hatch",
  TERRITORY: "SUV",
  EDGE: "SUV",
  CIVIC: "Sedan",
  CITY: "Sedan",
  FIT: "Hatch",
  "HR-V": "SUV",
  "WR-V": "SUV",
  "CR-V": "SUV",
  ACCORD: "Sedan",
  HB20: "Hatch",
  HB20S: "Sedan",
  CRETA: "SUV",
  TUCSON: "SUV",
  IX35: "SUV",
  "SANTA FE": "SUV",
  AZERA: "Sedan",
  I30: "Hatch",
  RENEGADE: "SUV",
  COMPASS: "SUV",
  COMMANDER: "SUV",
  CHEROKEE: "SUV",
  WRANGLER: "SUV",
  KWID: "Hatch",
  SANDERO: "Hatch",
  LOGAN: "Sedan",
  DUSTER: "SUV",
  CAPTUR: "SUV",
  OROCH: "Caminhonete",
  STEPWAY: "Hatch",
  CLIO: "Hatch",
  COROLLA: "Sedan",
  "COROLLA CROSS": "SUV",
  YARIS: "Hatch",
  HILUX: "Caminhonete",
  ETIOS: "Hatch",
  RAV4: "SUV",
  SW4: "SUV",
  GOL: "Hatch",
  POLO: "Hatch",
  VIRTUS: "Sedan",
  "T-CROSS": "SUV",
  NIVUS: "SUV",
  SAVEIRO: "Caminhonete",
  JETTA: "Sedan",
  GOLF: "Hatch",
  VOYAGE: "Sedan",
  UP: "Hatch",
};
const inferCat = (model) => MODEL_CAT[(model || "").toUpperCase()] || "";
const inferTransm = (v) => (/aut/i.test(v || "") ? "Automático" : "Manual");
const inferFuel = (v) =>
  /diesel/i.test(v || "") ? "Diesel" : /gasolina/i.test(v || "") ? "Gasolina" : "Flex";

const MoneyInput = ({ value, onChange, placeholder, autoFocus }) => {
  const display = value === "" || value == null ? "" : brlc(value);
  const handle = (e) => {
    const d = e.target.value.replace(/\D/g, "");
    onChange(d ? parseInt(d, 10) / 100 : "");
  };
  return (
    <div style={{ position: "relative" }}>
      <span
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--muted)",
          fontWeight: 600,
          fontSize: 14,
          pointerEvents: "none",
        }}
      >
        R$
      </span>
      <input
        className="inp"
        style={{ paddingLeft: 42 }}
        inputMode="numeric"
        placeholder={placeholder || "0,00"}
        value={display}
        onChange={handle}
        autoFocus={autoFocus}
      />
    </div>
  );
};

const KmInput = ({ value, onChange, placeholder }) => {
  const n =
    typeof value === "number"
      ? value
      : value === "" || value == null
        ? ""
        : parseInt(String(value).replace(/\D/g, ""), 10);
  const display = n === "" || isNaN(n) ? "" : n.toLocaleString("pt-BR");
  const handle = (e) => {
    const d = e.target.value.replace(/\D/g, "");
    onChange(d ? parseInt(d, 10) : "");
  };
  return (
    <div style={{ position: "relative" }}>
      <input
        className="inp"
        style={{ paddingRight: 44 }}
        inputMode="numeric"
        placeholder={placeholder || "0"}
        value={display}
        onChange={handle}
      />
      <span
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--muted)",
          fontWeight: 600,
          fontSize: 13,
          pointerEvents: "none",
        }}
      >
        km
      </span>
    </div>
  );
};

const Combobox = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  emptyText = "Nenhuma opção encontrada",
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || "");
  const filtered = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()));
  const pick = (o) => {
    onChange(o);
    setQ(o);
    setOpen(false);
  };
  const onType = (val) => {
    setQ(val);
    setOpen(true);
    const exact = options.find((o) => o.toLowerCase() === val.trim().toLowerCase());
    onChange(exact || "");
  };
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          className="inp"
          style={{ paddingRight: 34 }}
          placeholder={placeholder}
          value={q}
          disabled={disabled}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <ChevronDown
          size={16}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted)",
            pointerEvents: "none",
          }}
        />
      </div>
      {open && !disabled && (
        <div className="cbx-pop">
          {filtered.length ? (
            filtered.map((o) => (
              <button
                key={o}
                className={`cbx-opt${o === value ? " on" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o);
                }}
              >
                {o}
                {o === value && <Check size={15} />}
              </button>
            ))
          ) : (
            <div className="cbx-empty">{emptyText}</div>
          )}
        </div>
      )}
    </div>
  );
};

const WZ_YEARS = Array.from({ length: 22 }, (_, i) => new Date().getFullYear() - i);
const WZ_STEPS = [
  ["Marca", "Qual a marca do veículo?"],
  ["Modelo", "Qual o modelo?"],
  ["Versão", "Qual a versão?"],
  ["Ano", "Qual o ano?"],
  ["Categoria", "Qual a categoria?"],
  ["Especificações", "Ficha técnica"],
  ["Localização", "Onde está o veículo?"],
  ["Preço", "Defina o preço"],
  ["Opcionais", "Opcionais e entrega"],
  ["Fotos", "Fotos e finalização"],
];

const VehicleForm = ({ initial, onCancel, onSave }) => {
  const [f, setF] = useState(() =>
    initial
      ? {
          brand: initial.brand,
          model: initial.model,
          version: initial.version,
          year: String(initial.year || ""),
          yearModel: String(initial.yearModel || initial.year || ""),
          cat: initial.cat,
          fuel: initial.fuel,
          color: initial.color,
          plate: plateOf(initial),
          fipe: String(initial.fipe || ""),
          price: initial.price || "",
          km: initial.km || "",
          transm: initial.transm || "Manual",
          obs: initial.obs || obsOf(initial),
          delivery: !!initial.delivery,
          optionals: initial.optionals || optsOf(initial),
          photos: initial.photos || [],
          state: CITY_TO_STATE[initial.city] || "",
          city: initial.city || "",
        }
      : MFORM_BLANK,
  );
  const [step, setStep] = useState(0);
  const [cropSrc, setCropSrc] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const fileInputRef = useRef(null);
  const set = (k, val) => setF((p) => ({ ...p, [k]: val }));
  const toggleOpt = (o) =>
    setF((p) => ({
      ...p,
      optionals: p.optionals.includes(o) ? p.optionals.filter((x) => x !== o) : [...p.optionals, o],
    }));
  const price = +f.price || 0,
    fipe = fipeFor(f.model, +f.year, f.cat);
  const diff = fipe ? Math.round(((price - fipe) / fipe) * 100) : 0;
  const valid = [
    !!f.brand,
    !!f.model,
    !!f.version,
    !!f.year && !!f.yearModel,
    !!f.cat,
    !!f.fuel && !!f.color && (typeof f.km === "number" || !!String(f.km).trim()),
    !!f.state && !!f.city,
    price > 0,
    true,
    f.photos.length >= 1,
  ];
  const canFinish = f.brand && f.model.trim() && price > 0 && f.photos.length >= 1 && !!f.city;
  const last = step === WZ_STEPS.length - 1;
  const submit = () =>
    onSave({
      ...(initial || {}),
      id: initial ? initial.id : undefined,
      brand: f.brand,
      model: f.model.trim(),
      version: f.version.trim() || "—",
      price,
      fipe,
      diff,
      year: +f.year || new Date().getFullYear(),
      yearModel: +f.yearModel || +f.year || new Date().getFullYear(),
      km: +f.km || 0,
      fuel: f.fuel || "Flex",
      transm: f.transm,
      color: f.color || "—",
      colorHex: (COLORS.find((c) => c[0] === f.color) || [])[1] || "#94a3b8",
      city: f.city || (initial ? initial.city : "Blumenau"),
      cat: f.cat || "Hatch",
      photos: f.photos,
      imgs: f.photos.length,
      score: initial ? initial.score : 78,
      views: initial ? initial.views : 0,
      delivery: f.delivery,
      status: initial ? initial.status : "ACTIVE",
      optionals: f.optionals,
      obs: f.obs,
    });
  const advance = () => {
    if (last) {
      if (canFinish) submit();
    } else if (valid[step]) setStep((s) => s + 1);
  };

  const renderStep = () => {
    if (step === 0)
      return (
        <div className="card card-p">
          <div className="choicegrid">
            {BRANDS.map((b) => (
              <button
                key={b}
                className={`choice${f.brand === b ? " on" : ""}`}
                onClick={() => setF((p) => ({ ...p, brand: b, model: "", version: "" }))}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      );
    if (step === 1)
      return (
        <div className="card card-p">
          <label className="lbl">Modelo</label>
          <Combobox
            key={f.brand}
            options={modelsFor(f.brand)}
            value={f.model}
            onChange={(v) => setF((p) => ({ ...p, model: v, version: "", cat: inferCat(v) }))}
            placeholder="Busque e selecione o modelo"
            emptyText="Nenhum modelo encontrado"
          />
          <div
            className="muted"
            style={{ fontSize: 11.5, marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}
          >
            <ShieldCheck size={13} />
            Modelos da marca {f.brand} — na Fase 2 vêm da Tabela FIPE.
          </div>
        </div>
      );
    if (step === 2)
      return (
        <div className="card card-p">
          <label className="lbl">Versão</label>
          <Combobox
            key={f.brand + f.model}
            options={versionsFor(f.model)}
            value={f.version}
            onChange={(v) =>
              setF((p) => ({
                ...p,
                version: v,
                transm: v ? inferTransm(v) : p.transm,
                fuel: v ? inferFuel(v) : p.fuel,
              }))
            }
            placeholder="Selecione a versão"
            emptyText="Nenhuma versão encontrada"
          />
          {f.version ? (
            <div className="ra-flex ra-center ra-wrap" style={{ gap: 8, marginTop: 12 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Preenchemos pra você:
              </span>
              <span
                className="bdg"
                style={{ background: "var(--success-t)", color: "var(--success)" }}
              >
                <Check size={12} />
                {inferTransm(f.version)}
              </span>
              <span
                className="bdg"
                style={{ background: "var(--success-t)", color: "var(--success)" }}
              >
                <Check size={12} />
                {inferFuel(f.version)}
              </span>
              {inferCat(f.model) && (
                <span
                  className="bdg"
                  style={{ background: "var(--success-t)", color: "var(--success)" }}
                >
                  <Check size={12} />
                  {inferCat(f.model)}
                </span>
              )}
            </div>
          ) : (
            <div
              className="muted"
              style={{
                fontSize: 11.5,
                marginTop: 10,
                display: "flex",
                gap: 6,
                alignItems: "center",
              }}
            >
              <ShieldCheck size={13} />
              Versões do {f.brand} {f.model} — na Fase 2 vêm da Tabela FIPE.
            </div>
          )}
        </div>
      );
    if (step === 3) {
      const fabSelected = !!f.year;
      const modelYears = fabSelected ? [+f.year, +f.year + 1] : [];
      return (
        <>
          {/* Display _/_ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              marginBottom: 20,
              fontFamily: "var(--display)",
              fontWeight: 700,
              fontSize: 38,
              letterSpacing: "-.02em",
            }}
          >
            <span
              style={{
                color: f.year ? "var(--text)" : "var(--border)",
                borderBottom: `3px solid ${f.year ? "var(--primary)" : "var(--border)"}`,
                padding: "2px 14px",
                minWidth: 110,
                textAlign: "center",
              }}
            >
              {f.year || "____"}
            </span>
            <span style={{ color: "var(--muted)", fontWeight: 300 }}>/</span>
            <span
              style={{
                color: f.yearModel ? "var(--text)" : "var(--border)",
                borderBottom: `3px solid ${f.yearModel ? "var(--primary)" : "var(--border)"}`,
                padding: "2px 14px",
                minWidth: 110,
                textAlign: "center",
              }}
            >
              {f.yearModel || "____"}
            </span>
          </div>

          {/* Card único que troca de modo */}
          <div className="card card-p step-anim" key={fabSelected ? "model" : "fab"}>
            <div className="ra-flex ra-between ra-center" style={{ marginBottom: 12 }}>
              <span className="micro">{fabSelected ? "Ano modelo" : "Ano de fabricação"}</span>
              {fabSelected && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "4px 10px", fontSize: 12 }}
                  onClick={() => {
                    set("year", "");
                    set("yearModel", "");
                  }}
                >
                  <ArrowLeft size={13} />
                  Trocar fabricação
                </button>
              )}
            </div>
            {fabSelected ? (
              <>
                <div className="choicegrid">
                  {modelYears.map((y) => (
                    <button
                      key={y}
                      className={`choice${f.yearModel === String(y) ? " on" : ""}`}
                      onClick={() => set("yearModel", String(y))}
                    >
                      {y}
                    </button>
                  ))}
                </div>
                <div
                  className="muted"
                  style={{
                    fontSize: 11.5,
                    marginTop: 12,
                    display: "flex",
                    gap: 6,
                    alignItems: "flex-start",
                  }}
                >
                  <Calendar size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  Mesmo ano da fabricação ou o seguinte (ex: 2022/2023).
                </div>
              </>
            ) : (
              <div className="choicegrid">
                {WZ_YEARS.map((y) => (
                  <button
                    key={y}
                    className={`choice${f.year === String(y) ? " on" : ""}`}
                    onClick={() => {
                      set("year", String(y));
                      set("yearModel", String(y));
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      );
    }
    if (step === 4)
      return (
        <div className="card card-p">
          <div className="choicegrid">
            {CATS.map((c) => (
              <button
                key={c}
                className={`choice${f.cat === c ? " on" : ""}`}
                onClick={() => set("cat", c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      );
    if (step === 5)
      return (
        <div className="card card-p">
          <div className="fgrid">
            <div>
              <label className="lbl">Combustível</label>
              <select className="inp" value={f.fuel} onChange={(e) => set("fuel", e.target.value)}>
                <option value="">Selecione</option>
                {FUELS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="lbl">Câmbio</label>
              <select
                className="inp"
                value={f.transm}
                onChange={(e) => set("transm", e.target.value)}
              >
                <option>Manual</option>
                <option>Automático</option>
              </select>
            </div>
            <div>
              <label className="lbl">Cor</label>
              <select
                className="inp"
                value={f.color}
                onChange={(e) => set("color", e.target.value)}
              >
                <option value="">Selecione</option>
                {COLORS.map(([n]) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="lbl">Quilometragem</label>
              <KmInput value={f.km} onChange={(v) => set("km", v)} placeholder="48.000" />
            </div>
            <div className="full">
              <label className="lbl">Placa</label>
              <input
                className="inp"
                placeholder="ABC-1D23"
                value={f.plate}
                onChange={(e) => set("plate", e.target.value)}
              />
            </div>
          </div>
        </div>
      );
    if (step === 6)
      return (
        <div className="card card-p">
          <div className="fgrid">
            <div>
              <label className="lbl">Estado</label>
              <select
                className="inp"
                value={f.state}
                onChange={(e) => {
                  set("state", e.target.value);
                  set("city", "");
                }}
              >
                <option value="">Selecione</option>
                {STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="lbl">Cidade</label>
              <select
                className="inp"
                value={f.city}
                disabled={!f.state}
                onChange={(e) => set("city", e.target.value)}
              >
                <option value="">{f.state ? "Selecione" : "Escolha um estado"}</option>
                {(CITIES_BY_STATE[f.state] || []).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div
            className="muted"
            style={{
              fontSize: 11.5,
              marginTop: 14,
              display: "flex",
              gap: 6,
              alignItems: "flex-start",
            }}
          >
            <MapPin size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            Compradores filtram por estado e cidade no catálogo. Use a localização real do veículo.
          </div>
        </div>
      );
    if (step === 7) {
      const rec = recommendPrice(f);
      return (
        <div className="card card-p">
          <div className="fipe-box">
            <div
              className="ra-flex ra-center"
              style={{ gap: 8, flex: 1, minWidth: 0, flexWrap: "wrap" }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: "var(--primary)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <BarChart3 size={16} />
              </div>
              <span className="micro" style={{ color: "var(--primary)" }}>
                Valor <strong style={{ fontWeight: 800 }}>FIPE</strong> de referência
              </span>
              <span
                className="bdg"
                style={{ background: "rgba(37,99,235,.12)", color: "var(--primary)", fontSize: 10 }}
              >
                <Lock size={10} />
                Automático
              </span>
            </div>
            <div className="v">R$ {brl(fipe)}</div>
          </div>

          {rec && (
            <div className="rec-box">
              <div
                className="ra-flex ra-center"
                style={{ gap: 8, flex: 1, minWidth: 0, flexWrap: "wrap" }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    background: "var(--trending)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={15} />
                </div>
                <span className="micro" style={{ color: "var(--trending)" }}>
                  Preço Recomendado
                </span>
                <span
                  className="bdg"
                  style={{
                    background: "rgba(255,107,0,.14)",
                    color: "var(--trending)",
                    fontSize: 10,
                  }}
                >
                  <Zap size={10} />
                  RadarAuto
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="v">R$ {brl(rec.price)}</div>
                <button
                  className="btn btn-trending btn-sm"
                  style={{ marginTop: 8 }}
                  onClick={() => set("price", rec.price)}
                >
                  <Check size={14} />
                  Aplicar este preço
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <label className="lbl">Seu preço de venda</label>
            <MoneyInput value={f.price} onChange={(v) => set("price", v)} autoFocus />
          </div>

          {price > 0 && (
            <div className="ra-flex ra-center ra-wrap" style={{ gap: 10, marginTop: 14 }}>
              <span
                className="bdg"
                style={{
                  background: diff <= 0 ? "var(--success-t)" : "var(--danger-t)",
                  color: diff <= 0 ? "var(--success)" : "var(--danger)",
                  fontSize: 12.5,
                  padding: "5px 11px",
                }}
              >
                {diff > 0 ? "+" : ""}
                {diff}% em relação à FIPE
              </span>
              <span className="muted" style={{ fontSize: 13 }}>
                {price < fipe
                  ? `R$ ${brl(fipe - price)} abaixo da tabela`
                  : price > fipe
                    ? `R$ ${brl(price - fipe)} acima da tabela`
                    : "No valor da tabela"}
              </span>
            </div>
          )}
        </div>
      );
    }
    if (step === 8)
      return (
        <>
          <div className="card card-p">
            <span className="micro">Opcionais</span>
            <div className="optsel" style={{ marginTop: 14 }}>
              {OPTIONALS_ALL.map((o) => (
                <button
                  key={o}
                  className={f.optionals.includes(o) ? "on" : ""}
                  onClick={() => toggleOpt(o)}
                >
                  {f.optionals.includes(o) ? <Check size={14} /> : <Plus size={14} />}
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div
            className="card card-p"
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: f.delivery ? "var(--success-t)" : "var(--muted-t)",
                color: f.delivery ? "var(--success)" : "var(--muted)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Truck size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Oferecer entrega (Car Delivery)</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                O anúncio ganha o selo "Entrega" e aparece no filtro de quem busca entrega.
              </div>
            </div>
            <Toggle on={f.delivery} onClick={() => set("delivery", !f.delivery)} />
          </div>
        </>
      );
    return (
      <>
        <div className="card card-p">
          <div className="ra-flex ra-between ra-center" style={{ marginBottom: 14 }}>
            <span className="micro">
              Fotos do veículo <span style={{ color: "var(--danger)" }}>*</span>
            </span>
            <span className="muted" style={{ fontSize: 12 }}>
              {f.photos.length} {f.photos.length === 1 ? "foto" : "fotos"}
            </span>
          </div>
          {f.photos.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "36px 20px",
                borderRadius: 14,
                border: "2px dashed var(--border)",
                background: "var(--bg-2)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.background = "var(--primary-t)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--bg-2)";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "var(--primary-t)",
                  color: "var(--primary)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Upload size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
                Adicione a primeira foto
              </div>
              <div className="muted" style={{ fontSize: 12.5, textAlign: "center", maxWidth: 320 }}>
                JPG ou PNG. Você poderá ajustar o corte (4:3) antes de salvar.
              </div>
            </button>
          ) : (
            <div className="photos">
              {f.photos.map((src, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragEnd={() => {
                    setDragIdx(null);
                    setOverIdx(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragIdx !== null && dragIdx !== i) setOverIdx(i);
                  }}
                  onDragLeave={() => {
                    if (overIdx === i) setOverIdx(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIdx === null || dragIdx === i) return;
                    const arr = [...f.photos];
                    const [moved] = arr.splice(dragIdx, 1);
                    arr.splice(i, 0, moved);
                    set("photos", arr);
                    setDragIdx(null);
                    setOverIdx(null);
                  }}
                  className="phototile"
                  style={{
                    position: "relative",
                    backgroundImage: `url(${src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: overIdx === i && dragIdx !== i ? "2px solid var(--primary)" : "none",
                    opacity: dragIdx === i ? 0.4 : 1,
                    cursor: "grab",
                    transition: "opacity .15s, border-color .15s",
                  }}
                >
                  {i === 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        background: "var(--primary)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 6,
                        letterSpacing: ".04em",
                        pointerEvents: "none",
                      }}
                    >
                      CAPA
                    </span>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      bottom: 6,
                      left: 6,
                      background: "rgba(15,23,42,.75)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 6,
                      pointerEvents: "none",
                    }}
                  >
                    {i + 1}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      set(
                        "photos",
                        f.photos.filter((_, idx) => idx !== i),
                      );
                    }}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      background: "rgba(15,23,42,.75)",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                    title="Remover"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button className="photoadd" onClick={() => fileInputRef.current?.click()}>
                <Upload size={20} />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !file.type.startsWith("image/")) return;
              const reader = new FileReader();
              reader.onload = (ev) => setCropSrc(ev.target.result);
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />
          {f.photos.length > 0 && (
            <div
              className="muted"
              style={{
                fontSize: 11.5,
                marginTop: 12,
                display: "flex",
                gap: 6,
                alignItems: "flex-start",
              }}
            >
              <ImageIcon size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              Cada foto é cortada em 4:3. <b>Arraste pra reordenar</b> — a primeira é a capa e a
              ordem aqui é a ordem da galeria.
            </div>
          )}
        </div>
        <div className="card card-p" style={{ marginTop: 16 }}>
          <span className="micro">Observações</span>
          <textarea
            className="inp"
            rows={3}
            style={{ marginTop: 12, resize: "vertical", minHeight: 72 }}
            placeholder="Detalhes, estado de conservação, etc."
            value={f.obs}
            onChange={(e) => set("obs", e.target.value)}
          />
        </div>
        <div className="card card-p" style={{ marginTop: 16, background: "var(--bg-2)" }}>
          <span className="micro">Resumo</span>
          <div
            className="ra-flex ra-between ra-center"
            style={{ marginTop: 12, flexWrap: "wrap", gap: 8 }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {f.brand || "—"} {f.model || ""}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {f.version || "—"} · {f.year || "—"} · {f.cat || "—"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="num" style={{ fontSize: 20 }}>
                {price > 0 ? `R$ ${brl(price)}` : "—"}
              </div>
              {fipe > 0 && price > 0 && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: diff < 0 ? "var(--success)" : "var(--danger)",
                    fontWeight: 600,
                  }}
                >
                  {diff}% FIPE
                </div>
              )}
            </div>
          </div>
          {f.delivery && (
            <div style={{ marginTop: 10 }}>
              <Badge tone="success" icon={Truck}>
                Com entrega
              </Badge>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="ra-flex ra-between ra-center" style={{ gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ padding: "8px 12px" }}>
          <X size={16} />
          Cancelar
        </button>
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
          {initial ? "Editar" : "Cadastrar"} · Passo {step + 1} de {WZ_STEPS.length}
        </span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div className="micro" style={{ color: "var(--primary)" }}>
          {WZ_STEPS[step][0]}
        </div>
        <h2 className="display" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
          {WZ_STEPS[step][1]}
        </h2>
      </div>

      <div className="wz-track">
        <div className="wz-line">
          <span style={{ width: `${4 + (step / (WZ_STEPS.length - 1)) * 88}%` }} />
        </div>
        <div className="wz-car" style={{ left: `${4 + (step / (WZ_STEPS.length - 1)) * 88}%` }}>
          <Car size={18} />
        </div>
        <div className={`wz-flag${last ? " done" : ""}`}>
          <Flag size={18} />
        </div>
      </div>

      <div className="step-anim" key={step}>
        {renderStep()}
      </div>

      <div className="ra-flex" style={{ gap: 12, marginTop: 20, justifyContent: "space-between" }}>
        <button
          className="btn btn-secondary"
          onClick={() => (step === 0 ? onCancel() : setStep((s) => s - 1))}
        >
          <ArrowLeft size={16} />
          {step === 0 ? "Cancelar" : "Voltar"}
        </button>
        {last ? (
          <button className="btn btn-primary" disabled={!canFinish} onClick={submit}>
            <Check size={16} />
            {initial ? "Salvar alterações" : "Cadastrar veículo"}
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!valid[step]} onClick={advance}>
            Continuar
            <ChevronRight size={16} />
          </button>
        )}
      </div>
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onApply={(url) => {
            setF((p) => ({ ...p, photos: [...p.photos, url] }));
            setCropSrc(null);
          }}
        />
      )}
    </div>
  );
};

const MyVehicles = ({
  list,
  role,
  onAdd,
  onUpdate,
  onStatus,
  onRemove,
  onApprove,
  onReject,
  onView,
}) => {
  const [mode, setMode] = useState("list");
  const [editing, setEditing] = useState(null);
  const [sf, setSf] = useState("ALL");
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const share = (v) => {
    const url = `${window.location.origin}/anuncio/${v.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setToast("Link copiado!");
          setTimeout(() => setToast(null), 2200);
        })
        .catch(() => {
          setToast("Link: " + url);
          setTimeout(() => setToast(null), 3500);
        });
    } else {
      setToast("Link: " + url);
      setTimeout(() => setToast(null), 3500);
    }
  };

  if (mode === "form")
    return (
      <VehicleForm
        initial={editing}
        onCancel={() => {
          setMode("list");
          setEditing(null);
        }}
        onSave={(veh) => {
          editing ? onUpdate(veh) : onAdd(veh);
          setMode("list");
          setEditing(null);
        }}
      />
    );

  const stats = {
    total: list.length,
    pending: list.filter((v) => v.status === "PENDING").length,
    active: list.filter((v) => v.status === "ACTIVE").length,
    sold: list.filter((v) => v.status === "SOLD").length,
    views: list.reduce((s, v) => s + (v.views || 0), 0),
  };
  const FILTERS = [
    ["ALL", "Todos"],
    ["PENDING", "Pendentes"],
    ["ACTIVE", "Ativos"],
    ["EXPIRED", "Expirados"],
    ["INACTIVE", "Inativos"],
    ["SOLD", "Vendidos"],
  ];
  const filtered = sf === "ALL" ? list : list.filter((v) => v.status === sf);
  const isLojista = role === "lojista";

  return (
    <>
      {stats.pending > 0 && isLojista && (
        <div
          className="card card-p"
          style={{
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "linear-gradient(120deg,var(--warning-t),transparent)",
            borderColor: "rgba(245,158,11,.3)",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "var(--warning)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {stats.pending} cadastro{stats.pending > 1 ? "s" : ""} aguardando sua aprovação
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
              Veículos enviados por funcionários precisam da sua aprovação para serem publicados.
            </div>
          </div>
          <button
            className="btn btn-warning btn-sm"
            style={{ background: "var(--warning)", color: "#fff" }}
            onClick={() => setSf("PENDING")}
          >
            Ver pendentes
          </button>
        </div>
      )}

      <div className="opp-stats">
        <OStat
          icon={Package}
          tint="primary"
          label="Anúncios"
          value={stats.total}
          sub="no seu estoque"
        />
        <OStat
          icon={Clock}
          tint="warning"
          label="Pendentes"
          value={stats.pending}
          sub="aguardando aprovação"
        />
        <OStat icon={Check} tint="success" label="Ativos" value={stats.active} sub="publicados" />
        <OStat
          icon={Eye}
          tint="trending"
          label="Visualizações"
          value={brl(stats.views)}
          sub="no total"
        />
      </div>

      <div className="ra-flex ra-between ra-center ra-wrap" style={{ gap: 12, marginBottom: 18 }}>
        <div className="seg">
          {FILTERS.map(([v, l]) => (
            <button key={v} className={sf === v ? "on" : ""} onClick={() => setSf(v)}>
              {l}
            </button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setMode("form");
          }}
        >
          <Plus size={17} />
          Cadastrar veículo
        </button>
      </div>

      {filtered.length === 0 ? (
        list.length === 0 ? (
          <EmptyState
            icon={Package}
            tone="primary"
            title="Seu estoque está vazio"
            desc="Cadastre seu primeiro veículo para começar a receber leads, aparecer no catálogo e medir o desempenho dos seus anúncios."
            action={{
              label: "Cadastrar primeiro veículo",
              icon: Plus,
              onClick: () => {
                setEditing(null);
                setMode("form");
              },
            }}
          />
        ) : (
          <EmptyState
            icon={SlidersHorizontal}
            title="Nada neste filtro"
            desc={`Você não tem veículos com o status selecionado. Tente "Todos" para ver tudo, ou cadastre um novo.`}
            action={{ label: "Ver todos", tone: "secondary", onClick: () => setSf("ALL") }}
          />
        )
      ) : (
        <div className="opp-list">
          {filtered.map((v) => (
            <div key={v.id} className="oitem" style={{ cursor: "default" }}>
              <div
                className="minv-thumb"
                style={
                  photoAt(v, 0)
                    ? {
                        backgroundImage: `url(${photoAt(v, 0)})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              >
                {!photoAt(v, 0) && <Car size={26} strokeWidth={1.4} />}
                {v.delivery && (
                  <span className="ov-bl" style={{ bottom: 6, left: 6 }}>
                    <span className="delivchip" style={{ padding: "2px 6px", fontSize: 10 }}>
                      <Truck size={10} />
                    </span>
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 170 }}>
                <div className="ra-flex ra-center" style={{ gap: 8, flexWrap: "wrap" }}>
                  <span className="display" style={{ fontWeight: 700, fontSize: 15.5 }}>
                    {v.brand} {v.model}
                  </span>
                  <Badge
                    tone={MSTATUS[v.status][0]}
                    icon={v.status === "PENDING" ? Clock : undefined}
                  >
                    {MSTATUS[v.status][1]}
                  </Badge>
                  {isHot(v) && (
                    <Badge tone="trending" icon={Flame}>
                      Em alta
                    </Badge>
                  )}
                  {v.createdBy === "funcionario" && (
                    <span
                      className="muted"
                      style={{
                        fontSize: 11.5,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Users size={12} />
                      por funcionário
                    </span>
                  )}
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                  {v.version}
                </div>
                <div
                  className="muted"
                  style={{ fontSize: 12, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}
                >
                  <span>
                    {yearLabel(v)} · {brl(v.km)} km
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Eye size={13} />
                    {brl(v.views)}
                  </span>
                </div>
                {v.status === "ACTIVE" && v.expiresAt && (
                  <div style={{ marginTop: 9 }}>
                    <Countdown expiresAt={v.expiresAt} onExpire={() => onStatus(v.id, "EXPIRED")} />
                  </div>
                )}
              </div>
              <div className="hide-sm" style={{ textAlign: "right", flexShrink: 0 }}>
                <div className="num" style={{ fontSize: 16 }}>
                  R$ {brl(v.price)}
                </div>
                {v.fipe > 0 && (
                  <div style={{ fontSize: 12, color: "var(--trending)", fontWeight: 600 }}>
                    {v.diff}% FIPE
                  </div>
                )}
              </div>
              <div className="ra-flex ra-center" style={{ gap: 8, flexWrap: "wrap" }}>
                {v.status === "PENDING" && isLojista && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => onApprove(v.id)}>
                      <Check size={14} />
                      Aprovar
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => onReject(v.id)}>
                      <X size={14} />
                      Reprovar
                    </button>
                  </>
                )}
                {v.status === "PENDING" && !isLojista && (
                  <span
                    className="muted"
                    style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5 }}
                  >
                    <Clock size={13} />
                    Aguardando aprovação do lojista
                  </span>
                )}
                {v.status === "ACTIVE" && (
                  <>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onStatus(v.id, "INACTIVE")}
                    >
                      Pausar
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onStatus(v.id, "SOLD")}
                    >
                      Vendido
                    </button>
                  </>
                )}
                {v.status === "INACTIVE" && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onStatus(v.id, "ACTIVE")}
                  >
                    Ativar
                  </button>
                )}
                {(v.status === "SOLD" || v.status === "EXPIRED") && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onStatus(v.id, "ACTIVE")}
                  >
                    <RotateCcw size={14} />
                    Reativar
                  </button>
                )}
                {v.status !== "PENDING" && (
                  <>
                    <button
                      className="iconbtn-sm"
                      title="Ver anúncio público"
                      onClick={() => onView(v.id)}
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      className="iconbtn-sm"
                      title="Compartilhar link"
                      onClick={() => share(v)}
                    >
                      <Share2 size={16} />
                    </button>
                  </>
                )}
                <button
                  className="iconbtn-sm"
                  title="Editar"
                  onClick={() => {
                    setEditing(v);
                    setMode("form");
                  }}
                >
                  <Pencil size={16} />
                </button>
                {isLojista && (
                  <button
                    className="iconbtn-sm danger"
                    title="Remover"
                    onClick={() => setConfirm(v)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <div className="ov" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>
              Remover anúncio?
            </div>
            <div className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
              O anúncio “{confirm.brand} {confirm.model}” será removido do seu estoque. Esta ação
              não pode ser desfeita.
            </div>
            <div className="ra-flex" style={{ gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setConfirm(null)}>
                Cancelar
              </button>
              <button
                className="btn"
                style={{ background: "var(--danger-t)", color: "var(--danger)" }}
                onClick={() => {
                  onRemove(confirm.id);
                  setConfirm(null);
                }}
              >
                <Trash2 size={15} />
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div
          className="card"
          style={{
            position: "fixed",
            top: 80,
            right: 24,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--success)",
            color: "#fff",
            border: "none",
            zIndex: 50,
            boxShadow: "var(--sh-lg)",
            animation: "notif-in .22s cubic-bezier(.34,1.3,.64,1)",
          }}
        >
          <Check size={17} />
          {toast}
        </div>
      )}
    </>
  );
};

/* ============================== LEADS (CRM) ============================== */
const LEAD_TONE = {
  HOT: ["trending", "Quente", Flame],
  WARM: ["warning", "Morno", null],
  COLD: ["muted", "Frio", null],
};
const leadScore = (l) =>
  l.intent || l.clicks >= 6 || (l.favorited && l.avgTime >= 120)
    ? "HOT"
    : l.clicks >= 3 || l.favorited || l.avgTime >= 90
      ? "WARM"
      : "COLD";
const fmtTime = (s) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`);
const relTime = (ts) => {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return "agora";
  if (m < 60) return `há ${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.round(h / 24)}d`;
};
const initials = (n) =>
  n
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
const LeadBadge = ({ s }) => {
  const [tone, label, Ic] = LEAD_TONE[s];
  return (
    <Badge tone={tone} icon={Ic || undefined}>
      {label}
    </Badge>
  );
};

const Leads = ({ leads, vehicles, onContact }) => {
  const [sf, setSf] = useState("ALL");
  const scored = leads.map((l) => ({ ...l, score: leadScore(l) }));
  const counts = { HOT: scored.filter((l) => l.score === "HOT").length };
  const avgAll = scored.length
    ? Math.round(scored.reduce((s, l) => s + l.avgTime, 0) / scored.length)
    : 0;
  const totalClicks = scored.reduce((s, l) => s + l.clicks, 0);
  const FILTERS = [
    ["ALL", "Todos"],
    ["HOT", "Quentes"],
    ["WARM", "Mornos"],
    ["COLD", "Frios"],
  ];
  const filtered = (sf === "ALL" ? scored : scored.filter((l) => l.score === sf)).sort(
    (a, b) => b.lastSeen - a.lastSeen,
  );
  const carOf = (id) => vehicles.find((v) => v.id === id) || VEHICLES.find((v) => v.id === id);

  return (
    <>
      <div className="opp-stats">
        <OStat icon={Users} tint="primary" label="Leads" value={scored.length} sub="interessados" />
        <OStat
          icon={Flame}
          tint="trending"
          label="Quentes"
          value={counts.HOT}
          sub="prontos pra fechar"
        />
        <OStat
          icon={Clock}
          tint="success"
          label="Tempo médio"
          value={fmtTime(avgAll)}
          sub="na página"
        />
        <OStat
          icon={MousePointerClick}
          tint="warning"
          label="Cliques"
          value={brl(totalClicks)}
          sub="no total"
        />
      </div>

      <div className="ra-flex ra-between ra-center ra-wrap" style={{ gap: 12, marginBottom: 18 }}>
        <div className="muted" style={{ fontSize: 13.5, maxWidth: 520, lineHeight: 1.5 }}>
          Cada pessoa que abre um dos seus anúncios vira um lead. Mais cliques e tempo na página =
          lead mais quente.
        </div>
        <div className="seg">
          {FILTERS.map(([v, l]) => (
            <button key={v} className={sf === v ? "on" : ""} onClick={() => setSf(v)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        leads.length === 0 ? (
          <EmptyState
            icon={Users}
            tone="primary"
            title="Ainda sem leads"
            desc="Quando alguém visualizar, favoritar ou clicar em contato em algum dos seus veículos, o lead aparece aqui automaticamente — com scoring e histórico."
          />
        ) : (
          <EmptyState
            icon={Flame}
            title="Nenhum lead com essa temperatura"
            desc="Mude o filtro para ver outros leads. Leads quentes geralmente têm muitos cliques, favoritaram o veículo ou clicaram em contato."
          />
        )
      ) : (
        <div className="opp-list">
          {filtered.map((l) => {
            const car = carOf(l.vehicleId);
            return (
              <div key={l.id} className="oitem" style={{ cursor: "default" }}>
                <div
                  className="lead-av"
                  style={{
                    background: `var(--${LEAD_TONE[l.score][0]}-t)`,
                    color: `var(--${LEAD_TONE[l.score][0]})`,
                  }}
                >
                  {initials(l.name)}
                </div>
                <div style={{ flex: 1, minWidth: 190 }}>
                  <div className="ra-flex ra-center" style={{ gap: 8, flexWrap: "wrap" }}>
                    <span className="display" style={{ fontWeight: 700, fontSize: 15.5 }}>
                      {l.name}
                      {l.you && (
                        <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}>
                          {" "}
                          · você
                        </span>
                      )}
                    </span>
                    <LeadBadge s={l.score} />
                  </div>
                  <div
                    className="muted"
                    style={{
                      fontSize: 12.5,
                      marginTop: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Car size={13} />
                    Interessado em: {car ? `${car.brand} ${car.model}` : "—"}
                  </div>
                  <div
                    className="muted"
                    style={{
                      fontSize: 12,
                      marginTop: 5,
                      display: "flex",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <MousePointerClick size={13} />
                      {l.clicks} cliques
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Clock size={13} />
                      {fmtTime(l.avgTime)} em média
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Eye size={13} />
                      visto {relTime(l.lastSeen)}
                    </span>
                  </div>
                </div>
                <div className="ra-flex ra-center" style={{ gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-wa btn-sm" onClick={() => onContact(l, "wa")}>
                    <MessageCircle size={15} />
                    WhatsApp
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onContact(l, "tg")}>
                    <Send size={14} />
                    Telegram
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

/* ============================== FUNCIONÁRIOS ============================== */
const EMP_BLANK = { name: "", phone: "", email: "", password: "", confirm: "" };
const maskPhone = (raw) => {
  const d = String(raw || "")
    .replace(/\D/g, "")
    .slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const EMP_STEPS = [
  ["Nome", "Como ele se chama?"],
  ["Telefone", "Telefone para contato"],
  ["E-mail", "E-mail de acesso"],
  ["Senha", "Defina uma senha"],
];

const EmployeeForm = ({ onCancel, onSave }) => {
  const [f, setF] = useState(EMP_BLANK);
  const [step, setStep] = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const phoneDigits = f.phone.replace(/\D/g, "");
  const valid = [
    f.name.trim().length >= 3,
    phoneDigits.length >= 10,
    validEmail(f.email),
    f.password.length >= 6 && f.password === f.confirm,
  ];
  const last = step === EMP_STEPS.length - 1;
  const submit = () =>
    onSave({
      id: Date.now(),
      name: f.name.trim(),
      phone: f.phone,
      email: f.email.trim().toLowerCase(),
      createdAt: Date.now(),
      active: true,
    });

  const renderStep = () => {
    if (step === 0)
      return (
        <div className="card card-p">
          <label className="lbl">Nome completo</label>
          <input
            className="inp"
            placeholder="João da Silva"
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
          />
        </div>
      );
    if (step === 1)
      return (
        <div className="card card-p">
          <label className="lbl">Telefone</label>
          <input
            className="inp"
            inputMode="numeric"
            placeholder="(47) 99999-9999"
            value={f.phone}
            onChange={(e) => set("phone", maskPhone(e.target.value))}
            autoFocus
          />
          <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>
            Usado para contato direto. Mínimo de 10 dígitos.
          </div>
        </div>
      );
    if (step === 2) {
      const err = f.email && !validEmail(f.email);
      return (
        <div className="card card-p">
          <label className="lbl">E-mail</label>
          <input
            className="inp"
            type="email"
            placeholder="joao@flashcarstore.com"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            autoFocus
          />
          {err && (
            <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>
              E-mail inválido
            </div>
          )}
          <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>
            Será o login do funcionário na plataforma.
          </div>
        </div>
      );
    }
    const errPwd = f.password && f.password.length < 6 ? "Mínimo 6 caracteres" : "";
    const errConf = f.confirm && f.password !== f.confirm ? "As senhas não conferem" : "";
    return (
      <>
        <div className="card card-p">
          <label className="lbl">Senha</label>
          <div style={{ position: "relative" }}>
            <input
              className="inp"
              style={{ paddingRight: 42 }}
              type={showPwd ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={f.password}
              onChange={(e) => set("password", e.target.value)}
              autoFocus
            />
            <button
              type="button"
              className="iconbtn-sm"
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
              }}
              onClick={() => setShowPwd((s) => !s)}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errPwd && (
            <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>{errPwd}</div>
          )}
        </div>
        <div className="card card-p" style={{ marginTop: 16 }}>
          <label className="lbl">Confirmar senha</label>
          <input
            className="inp"
            type={showPwd ? "text" : "password"}
            placeholder="Repita a senha"
            value={f.confirm}
            onChange={(e) => set("confirm", e.target.value)}
          />
          {errConf && (
            <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>{errConf}</div>
          )}
          <div
            className="muted"
            style={{
              fontSize: 11.5,
              marginTop: 14,
              display: "flex",
              gap: 6,
              alignItems: "flex-start",
            }}
          >
            <ShieldCheck size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            Em produção, a senha é hasheada no backend (bcrypt) e o funcionário recebe um e-mail
            para primeiro acesso.
          </div>
        </div>
        <div className="card card-p" style={{ marginTop: 16, background: "var(--bg-2)" }}>
          <span className="micro">Resumo</span>
          <div className="ra-flex ra-center" style={{ gap: 12, marginTop: 12 }}>
            <div
              className="lead-av"
              style={{ background: "var(--primary-t)", color: "var(--primary)" }}
            >
              {f.name ? initials(f.name) : "—"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{f.name || "—"}</div>
              <div
                className="muted"
                style={{ fontSize: 12.5, marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Phone size={12} />
                  {f.phone || "—"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Send size={12} />
                  {f.email || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="ra-flex ra-between ra-center" style={{ gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ padding: "8px 12px" }}>
          <X size={16} />
          Cancelar
        </button>
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Novo funcionário · Passo {step + 1} de {EMP_STEPS.length}
        </span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div className="micro" style={{ color: "var(--primary)" }}>
          {EMP_STEPS[step][0]}
        </div>
        <h2 className="display" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
          {EMP_STEPS[step][1]}
        </h2>
      </div>

      <div className="wz-track">
        <div className="wz-line">
          <span style={{ width: `${4 + (step / (EMP_STEPS.length - 1)) * 88}%` }} />
        </div>
        <div
          className={`wz-car${last ? " success" : ""}`}
          style={{ left: `${4 + (step / (EMP_STEPS.length - 1)) * 88}%` }}
        >
          <User size={18} />
        </div>
        <div className={`wz-flag${last ? " done" : ""}`}>
          <Flag size={18} />
        </div>
      </div>

      <div className="step-anim" key={step}>
        {renderStep()}
      </div>

      <div className="ra-flex" style={{ gap: 12, marginTop: 20, justifyContent: "space-between" }}>
        <button
          className="btn btn-secondary"
          onClick={() => (step === 0 ? onCancel() : setStep((s) => s - 1))}
        >
          <ArrowLeft size={16} />
          {step === 0 ? "Cancelar" : "Voltar"}
        </button>
        {last ? (
          <button className="btn btn-primary" disabled={!valid[step]} onClick={submit}>
            <Check size={16} />
            Cadastrar funcionário
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={!valid[step]}
            onClick={() => setStep((s) => s + 1)}
          >
            Continuar
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

const Employees = ({ list, onAdd, onToggle, onRemove }) => {
  const [mode, setMode] = useState("list");
  const [confirm, setConfirm] = useState(null);
  if (mode === "form")
    return (
      <EmployeeForm
        onCancel={() => setMode("list")}
        onSave={(emp) => {
          onAdd(emp);
          setMode("list");
        }}
      />
    );
  const active = list.filter((e) => e.active).length;

  return (
    <>
      <div className="opp-stats">
        <OStat
          icon={Users}
          tint="primary"
          label="Funcionários"
          value={list.length}
          sub="cadastrados"
        />
        <OStat icon={Check} tint="success" label="Ativos" value={active} sub="com acesso" />
        <OStat
          icon={Lock}
          tint="muted"
          label="Inativos"
          value={list.length - active}
          sub="bloqueados"
        />
      </div>

      <div className="ra-flex ra-between ra-center ra-wrap" style={{ gap: 12, marginBottom: 18 }}>
        <div className="muted" style={{ fontSize: 13.5, maxWidth: 520, lineHeight: 1.5 }}>
          Funcionários podem cadastrar veículos, que ficam aguardando sua aprovação antes de serem
          publicados.
        </div>
        <button className="btn btn-primary" onClick={() => setMode("form")}>
          <Plus size={17} />
          Novo funcionário
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          tone="primary"
          title="Sua equipe está vazia"
          desc="Cadastre funcionários para que eles possam criar anúncios em nome da loja. Os cadastros feitos por eles passam pela sua aprovação antes de publicar."
          action={{
            label: "Adicionar primeiro funcionário",
            icon: Plus,
            onClick: () => setMode("form"),
          }}
        />
      ) : (
        <div className="opp-list">
          {list.map((e) => (
            <div key={e.id} className="oitem" style={{ cursor: "default" }}>
              <div
                className="lead-av"
                style={{
                  background: e.active ? "var(--primary-t)" : "var(--muted-t)",
                  color: e.active ? "var(--primary)" : "var(--muted)",
                }}
              >
                {initials(e.name)}
              </div>
              <div style={{ flex: 1, minWidth: 190 }}>
                <div className="ra-flex ra-center" style={{ gap: 8, flexWrap: "wrap" }}>
                  <span className="display" style={{ fontWeight: 700, fontSize: 15.5 }}>
                    {e.name}
                  </span>
                  {e.active ? (
                    <Badge tone="success" icon={Check}>
                      Ativo
                    </Badge>
                  ) : (
                    <Badge tone="muted" icon={Lock}>
                      Inativo
                    </Badge>
                  )}
                </div>
                <div
                  className="muted"
                  style={{
                    fontSize: 12.5,
                    marginTop: 4,
                    display: "flex",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Phone size={13} />
                    {e.phone}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Send size={13} />
                    {e.email}
                  </span>
                </div>
              </div>
              <div className="ra-flex ra-center" style={{ gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-secondary btn-sm" onClick={() => onToggle(e.id)}>
                  {e.active ? (
                    <>
                      <Lock size={14} />
                      Bloquear
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Ativar
                    </>
                  )}
                </button>
                <button className="iconbtn-sm danger" title="Remover" onClick={() => setConfirm(e)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <div className="ov" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>
              Remover funcionário?
            </div>
            <div className="muted" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
              {confirm.name} perderá o acesso à plataforma imediatamente. Esta ação não pode ser
              desfeita.
            </div>
            <div className="ra-flex" style={{ gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setConfirm(null)}>
                Cancelar
              </button>
              <button
                className="btn"
                style={{ background: "var(--danger-t)", color: "var(--danger)" }}
                onClick={() => {
                  onRemove(confirm.id);
                  setConfirm(null);
                }}
              >
                <Trash2 size={15} />
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ============================== CONFIGURAÇÃO ============================== */
const NOTIF_OPTS = [
  ["new_lead", "Novo lead recebido", "Aviso sempre que alguém abrir um dos seus anúncios"],
  ["hot_lead", "Lead esquentou (Quente)", "Quando um lead frio ou morno vira quente"],
  ["expiring", "Anúncio expirando", "Avisa 2h antes do anúncio expirar"],
  ["pending", "Cadastro pendente de aprovação", "Quando um funcionário envia um veículo"],
  ["opportunity", "Nova oportunidade no radar", "Carros abaixo da FIPE aparecendo no catálogo"],
  ["weekly", "Resumo semanal por e-mail", "Performance da sua loja, todo domingo"],
];

const SectionCard = ({ icon: Icon, tint = "primary", title, desc, children, action }) => (
  <div className="card card-p" style={{ marginBottom: 18 }}>
    <div className="ra-flex ra-between ra-center ra-wrap" style={{ gap: 12, marginBottom: 18 }}>
      <div className="ra-flex ra-center" style={{ gap: 12, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: `var(--${tint}-t)`,
            color: `var(--${tint})`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>
            {title}
          </div>
          {desc && (
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              {desc}
            </div>
          )}
        </div>
      </div>
      {action}
    </div>
    {children}
  </div>
);

const Settings = ({ role, onLogout }) => {
  const [profile, setProfile] = useState({
    store: "Flash Car Store",
    cnpj: "12.345.678/0001-90",
    phone: "(47) 3322-1100",
    email: "contato@flashcarstore.com",
    city: "Blumenau",
    state: "SC",
  });
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [prefs, setPrefs] = useState({
    defaultCity: "Blumenau",
    defaultState: "SC",
    deliveryDefault: true,
    deliveryDays: 5,
  });
  const [notif, setNotif] = useState({
    new_lead: true,
    hot_lead: true,
    expiring: true,
    pending: true,
    opportunity: false,
    weekly: true,
  });
  const [saved, setSaved] = useState(null);

  const setP = (k, v) => setProfile((s) => ({ ...s, [k]: v }));
  const setPr = (k, v) => setPrefs((s) => ({ ...s, [k]: v }));
  const pwdValid = pwd.current.length >= 6 && pwd.next.length >= 6 && pwd.next === pwd.confirm;
  const flash = (msg) => {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2200);
  };
  const isLojista = role === "lojista";

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {saved && (
        <div
          className="card"
          style={{
            position: "fixed",
            top: 80,
            right: 24,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--success)",
            color: "#fff",
            border: "none",
            zIndex: 50,
            boxShadow: "var(--sh-lg)",
          }}
        >
          <Check size={17} />
          {saved}
        </div>
      )}

      {/* PERFIL & LOJA — só para lojista */}
      {isLojista && (
        <SectionCard
          icon={Crown}
          tint="primary"
          title="Perfil & loja"
          desc="Dados da sua empresa"
          action={
            <button className="btn btn-secondary btn-sm" onClick={() => flash("Perfil atualizado")}>
              <Check size={14} />
              Salvar
            </button>
          }
        >
          <div className="ra-flex ra-center" style={{ gap: 14, marginBottom: 18 }}>
            <div className="av" style={{ width: 56, height: 56, borderRadius: 14, fontSize: 18 }}>
              FC
            </div>
            <button className="btn btn-secondary btn-sm">Trocar logo</button>
          </div>
          <div className="fgrid">
            <div>
              <label className="lbl">Nome da loja</label>
              <input
                className="inp"
                value={profile.store}
                onChange={(e) => setP("store", e.target.value)}
              />
            </div>
            <div>
              <label className="lbl">CNPJ</label>
              <input
                className="inp"
                value={profile.cnpj}
                onChange={(e) => setP("cnpj", e.target.value)}
              />
            </div>
            <div>
              <label className="lbl">Telefone</label>
              <input
                className="inp"
                value={profile.phone}
                onChange={(e) => setP("phone", maskPhone(e.target.value))}
              />
            </div>
            <div>
              <label className="lbl">E-mail</label>
              <input
                className="inp"
                type="email"
                value={profile.email}
                onChange={(e) => setP("email", e.target.value)}
              />
            </div>
            <div>
              <label className="lbl">Cidade</label>
              <input
                className="inp"
                value={profile.city}
                onChange={(e) => setP("city", e.target.value)}
              />
            </div>
            <div>
              <label className="lbl">UF</label>
              <input
                className="inp"
                maxLength={2}
                value={profile.state}
                onChange={(e) => setP("state", e.target.value.toUpperCase())}
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* TROCAR SENHA */}
      <SectionCard
        icon={Lock}
        tint="primary"
        title="Trocar senha"
        desc="Mantenha sua conta protegida"
        action={
          <button
            className="btn btn-primary btn-sm"
            disabled={!pwdValid}
            onClick={() => {
              setPwd({ current: "", next: "", confirm: "" });
              flash("Senha alterada");
            }}
          >
            <Check size={14} />
            Atualizar
          </button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="lbl">Senha atual</label>
            <input
              className="inp"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
            />
          </div>
          <div>
            <label className="lbl">Nova senha</label>
            <div style={{ position: "relative" }}>
              <input
                className="inp"
                style={{ paddingRight: 42 }}
                type={showPwd ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              />
              <button
                type="button"
                className="iconbtn-sm"
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                }}
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="lbl">Confirmar nova senha</label>
            <input
              className="inp"
              type={showPwd ? "text" : "password"}
              placeholder="Repita a nova senha"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
            {pwd.confirm && pwd.next !== pwd.confirm && (
              <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 6 }}>
                As senhas não conferem
              </div>
            )}
          </div>
          <div className="muted" style={{ fontSize: 11.5, display: "flex", gap: 6 }}>
            <ShieldCheck size={13} style={{ flexShrink: 0, marginTop: 1 }} />A nova senha é validada
            e hasheada no backend (bcrypt).
          </div>
        </div>
      </SectionCard>

      {/* PREFERÊNCIAS DE ANÚNCIO — só para quem cadastra */}
      {isLojista && (
        <SectionCard
          icon={Cog}
          tint="warning"
          title="Preferências de anúncio"
          desc="Defaults usados ao cadastrar um veículo"
          action={
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => flash("Preferências salvas")}
            >
              <Check size={14} />
              Salvar
            </button>
          }
        >
          <div className="fgrid">
            <div>
              <label className="lbl">Cidade padrão</label>
              <input
                className="inp"
                value={prefs.defaultCity}
                onChange={(e) => setPr("defaultCity", e.target.value)}
              />
            </div>
            <div>
              <label className="lbl">UF padrão</label>
              <input
                className="inp"
                maxLength={2}
                value={prefs.defaultState}
                onChange={(e) => setPr("defaultState", e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <div
            className="card card-p"
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              background: "var(--bg-2)",
              border: "none",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: prefs.deliveryDefault ? "var(--success-t)" : "var(--muted-t)",
                color: prefs.deliveryDefault ? "var(--success)" : "var(--muted)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Truck size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Oferecer entrega por padrão</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                O toggle de Car Delivery vem ligado no cadastro
              </div>
            </div>
            <Toggle
              on={prefs.deliveryDefault}
              onClick={() => setPr("deliveryDefault", !prefs.deliveryDefault)}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <label className="lbl">Prazo médio de entrega (dias)</label>
            <input
              className="inp"
              inputMode="numeric"
              value={prefs.deliveryDays}
              onChange={(e) => setPr("deliveryDays", e.target.value.replace(/\D/g, ""))}
              style={{ maxWidth: 160 }}
            />
          </div>
        </SectionCard>
      )}

      {/* NOTIFICAÇÕES */}
      <SectionCard
        icon={Bell}
        tint="trending"
        title="Notificações"
        desc="Escolha o que te avisamos"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NOTIF_OPTS.map(([k, label, sub]) => (
            <div
              key={k}
              className="ra-flex ra-between ra-center"
              style={{ gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {sub}
                </div>
              </div>
              <Toggle on={!!notif[k]} onClick={() => setNotif((s) => ({ ...s, [k]: !s[k] }))} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* SAIR */}
      <div
        className="card card-p"
        style={{
          background: "linear-gradient(120deg,var(--danger-t),transparent)",
          borderColor: "rgba(239,68,68,.25)",
        }}
      >
        <div className="ra-flex ra-between ra-center ra-wrap" style={{ gap: 14 }}>
          <div className="ra-flex ra-center" style={{ gap: 12, flex: 1, minWidth: 200 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: "var(--danger-t)",
                color: "var(--danger)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <LogOut size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>
                Encerrar sessão
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                Você será desconectado desta plataforma
              </div>
            </div>
          </div>
          <button
            className="btn"
            style={{ background: "var(--danger)", color: "#fff" }}
            onClick={onLogout}
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================== APP ============================== */

export default function App() {
  const [nav, setNav] = useState("vehicles");
  const [selectedId, setSelectedId] = useState(null);
  const [vehicleFromNav, setVehicleFromNav] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [premium, setPremium] = useState(false);
  const [planCycle, setPlanCycle] = useState(null);
  const [role, setRole] = useState("lojista");
  const [employees, setEmployees] = useState(() => [
    {
      id: 1,
      name: "João Silva",
      phone: "(47) 99102-3344",
      email: "joao@flashcarstore.com",
      createdAt: Date.now() - 12 * 86400000,
      active: true,
    },
    {
      id: 2,
      name: "Mariana Costa",
      phone: "(47) 99875-1122",
      email: "mariana@flashcarstore.com",
      createdAt: Date.now() - 4 * 86400000,
      active: true,
    },
  ]);
  const [myVehicles, setMyVehicles] = useState(() => {
    const now = Date.now();
    const seed = {
      0: { status: "ACTIVE", exp: 22 },
      1: { status: "ACTIVE", exp: 1.5 },
      2: { status: "SOLD" },
      3: { status: "PENDING", createdBy: "funcionario" },
      4: { status: "INACTIVE" },
      5: { status: "EXPIRED" },
    };
    return VEHICLES.slice(0, 6).map((v, i) => ({
      ...v,
      status: seed[i].status,
      expiresAt: seed[i].exp ? now + seed[i].exp * 3600 * 1000 : null,
      createdBy: seed[i].createdBy || "lojista",
    }));
  });
  const [favorites, setFavorites] = useState(
    () => new Set(VEHICLES.filter((v) => v.fav).map((v) => v.id)),
  );
  const [leads, setLeads] = useState(() => {
    const n = Date.now(),
      M = 60000;
    return [
      {
        id: "l1",
        name: "Carlos Mendes",
        phone: "(47) 99102-3344",
        vehicleId: 1,
        clicks: 12,
        avgTime: 214,
        lastSeen: n - 8 * M,
        favorited: true,
        intent: true,
      },
      {
        id: "l2",
        name: "Patrícia Souza",
        phone: "(47) 99875-1122",
        vehicleId: 4,
        clicks: 9,
        avgTime: 165,
        lastSeen: n - 35 * M,
        favorited: true,
        intent: false,
      },
      {
        id: "l3",
        name: "Rafael Lima",
        phone: "(48) 99230-7788",
        vehicleId: 2,
        clicks: 5,
        avgTime: 98,
        lastSeen: n - 120 * M,
        favorited: false,
        intent: false,
      },
      {
        id: "l4",
        name: "Juliana Alves",
        phone: "(47) 99650-4455",
        vehicleId: 6,
        clicks: 3,
        avgTime: 72,
        lastSeen: n - 240 * M,
        favorited: false,
        intent: false,
      },
      {
        id: "l5",
        name: "Marcos Pereira",
        phone: "(48) 99411-9090",
        vehicleId: 1,
        clicks: 2,
        avgTime: 41,
        lastSeen: n - 1440 * M,
        favorited: false,
        intent: false,
      },
      {
        id: "l6",
        name: "Fernanda Castro",
        phone: "(47) 99388-2211",
        vehicleId: 5,
        clicks: 1,
        avgTime: 28,
        lastSeen: n - 2880 * M,
        favorited: false,
        intent: false,
      },
    ];
  });
  const [events, setEvents] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sbOpen, setSbOpen] = useState(false);
  const [q, setQ] = useState("");
  const idRef = useRef(0);

  const track = (name, payload = {}) => {
    idRef.current += 1;
    const t = new Date().toLocaleTimeString("pt-BR");
    setEvents((p) => [{ id: idRef.current, name, payload, t }, ...p].slice(0, 50));
  };
  const scrollTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {}
  };

  useEffect(() => {
    track("catalog_view", { sort: "score" });
  }, []);

  const upsertVisitor = (id) => {
    if (!myVehicles.some((v) => v.id === id)) return;
    const sess = 30 + Math.floor(Math.random() * 100);
    setLeads((prev) => {
      const ex = prev.find((l) => l.id === "you");
      if (ex) {
        const _sessions = (ex._sessions || 1) + 1,
          _total = (ex._total || ex.avgTime) + sess;
        return prev.map((l) =>
          l.id === "you"
            ? {
                ...l,
                vehicleId: id,
                clicks: l.clicks + 1,
                lastSeen: Date.now(),
                _sessions,
                _total,
                avgTime: Math.round(_total / _sessions),
              }
            : l,
        );
      }
      return [
        {
          id: "you",
          name: "Visitante",
          phone: "(47) 90000-0000",
          vehicleId: id,
          clicks: 1,
          avgTime: sess,
          lastSeen: Date.now(),
          favorited: false,
          intent: false,
          _sessions: 1,
          _total: sess,
          you: true,
        },
        ...prev,
      ];
    });
  };
  const contactLead = (lead, ch) =>
    track(ch === "wa" ? "lead_whatsapp" : "lead_telegram", {
      lead: lead.name,
      vehicle_id: lead.vehicleId,
    });

  const openVehicle = (id, source) => {
    setVehicleFromNav(nav); // guarda de onde veio (vehicles, mine, opportunities, etc)
    setSelectedId(id);
    setSbOpen(false);
    scrollTop();
    if (source === "owner") return; // dono visualizando próprio anúncio: não conta como view nem como lead
    track("vehicle_view", { vehicle_id: id, source });
    upsertVisitor(id);
  };
  const back = () => {
    if (selectedStore && selectedId) {
      setSelectedId(null);
    } else if (selectedStore) {
      const fromV = selectedStore.fromVehicleId;
      setSelectedStore(null);
      if (fromV) setSelectedId(fromV);
    } else {
      setSelectedId(null);
      setVehicleFromNav(null);
    }
    scrollTop();
  };
  const openStore = (storeId) => {
    setSelectedStore({ id: storeId, fromVehicleId: selectedId });
    setSelectedId(null);
    setSbOpen(false);
    track("store_view", { store_id: storeId });
    scrollTop();
  };
  const goNav = (id) => {
    setNav(id);
    setSelectedId(null);
    setSelectedStore(null);
    setSbOpen(false);
    scrollTop();
  };
  const toggleFav = (id) => {
    const willAdd = !favorites.has(id);
    setFavorites((prev) => {
      const n = new Set(prev);
      willAdd ? n.add(id) : n.delete(id);
      return n;
    });
    track(willAdd ? "favorite_added" : "favorite_removed", { vehicle_id: id });
    if (willAdd && myVehicles.some((v) => v.id === id))
      setLeads((prev) =>
        prev.map((l) => (l.id === "you" ? { ...l, favorited: true, intent: true } : l)),
      );
  };
  const setPlan = (isPrem) => {
    setPremium(isPrem);
    setPlanCycle(isPrem ? planCycle || "quarterly" : null);
    track("plan_changed", { plan: isPrem ? "premium" : "free" });
  };

  const subscribe = (cycle) => {
    setPremium(true);
    setPlanCycle(cycle);
    track("subscription_completed", { plan: `PREMIUM_${cycle.toUpperCase()}` });
  };
  const cancelPlan = () => {
    setPremium(false);
    setPlanCycle(null);
    track("subscription_cancelled", {});
  };

  useEffect(() => {
    if (!ROLES[role].nav.includes(nav)) setNav(ROLES[role].nav[0]);
  }, [role, nav]);

  const addVehicle = (veh) => {
    const id = Math.max(0, ...VEHICLES.map((x) => x.id), ...myVehicles.map((x) => x.id)) + 1;
    const auto = autoApproves(role);
    const status = auto ? "ACTIVE" : "PENDING";
    setMyVehicles((p) => [
      { ...veh, id, status, createdBy: role, expiresAt: auto ? Date.now() + LISTING_MS : null },
      ...p,
    ]);
    track(auto ? "listing_created" : "listing_submitted_for_approval", {
      vehicle_id: id,
      model: `${veh.brand} ${veh.model}`,
      role,
    });
  };
  const approveVehicle = (id) => {
    setMyVehicles((p) =>
      p.map((x) =>
        x.id === id ? { ...x, status: "ACTIVE", expiresAt: Date.now() + LISTING_MS } : x,
      ),
    );
    track("listing_approved", { vehicle_id: id });
  };
  const rejectVehicle = (id) => {
    setMyVehicles((p) => p.map((x) => (x.id === id ? { ...x, status: "INACTIVE" } : x)));
    track("listing_rejected", { vehicle_id: id });
  };

  const addEmployee = (emp) => {
    setEmployees((p) => [emp, ...p]);
    track("employee_created", { employee_id: emp.id, name: emp.name });
  };
  const toggleEmployee = (id) => {
    setEmployees((p) => p.map((e) => (e.id === id ? { ...e, active: !e.active } : e)));
    track("employee_toggled", { employee_id: id });
  };
  const removeEmployee = (id) => {
    setEmployees((p) => p.filter((e) => e.id !== id));
    track("employee_removed", { employee_id: id });
  };

  const doLogout = () => {
    track("logout", { role });
    setNav(ROLES[role].nav[0]);
    setSelectedId(null);
    alert(
      "Sessão encerrada (simulado).\n\nNo backend real, isso invalidaria o token e redirecionaria pro login.",
    );
  };
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [themeId, setThemeId] = useState("blue");
  useEffect(() => {
    const t = THEMES.find((x) => x.id === themeId) || THEMES[0];
    const root = document.documentElement;
    root.style.setProperty("--primary", t.base);
    root.style.setProperty("--primary-hover", t.hover);
    root.style.setProperty("--primary-t", t.tint);
  }, [themeId]);
  const [readIds, setReadIds] = useState(new Set());
  const notifications = useMemo(
    () => buildNotifications({ role, myVehicles, leads, vehicles: VEHICLES }),
    [role, myVehicles, leads],
  );
  useEffect(() => {
    if (!notifOpen) return;
    const close = (e) => {
      if (!e.target.closest(".notif-wrap")) setNotifOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [notifOpen]);
  useEffect(() => {
    if (!userOpen) return;
    const close = (e) => {
      if (!e.target.closest(".usr-wrap")) setUserOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [userOpen]);
  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));
  const updateVehicle = (veh) => {
    setMyVehicles((p) => p.map((x) => (x.id === veh.id ? { ...x, ...veh } : x)));
    track("listing_updated", { vehicle_id: veh.id });
  };
  const setVehStatus = (id, status) => {
    setMyVehicles((p) =>
      p.map((x) =>
        x.id === id
          ? { ...x, status, expiresAt: status === "ACTIVE" ? Date.now() + LISTING_MS : x.expiresAt }
          : x,
      ),
    );
    track("listing_status_changed", { vehicle_id: id, status });
  };
  const removeVehicle = (id) => {
    setMyVehicles((p) => p.filter((x) => x.id !== id));
    track("listing_removed", { vehicle_id: id });
  };

  const vehicle =
    selectedId != null
      ? myVehicles.find((v) => v.id === selectedId) || VEHICLES.find((v) => v.id === selectedId)
      : null;
  const inDetail = !!vehicle;
  const mode = inDetail
    ? "detail"
    : selectedStore
      ? "page"
      : nav === "vehicles"
        ? "marketplace"
        : "section";
  const backLabel =
    inDetail && selectedStore
      ? "Loja"
      : selectedStore && selectedStore.fromVehicleId
        ? "Veículo"
        : inDetail && vehicleFromNav && TITLES[vehicleFromNav]
          ? TITLES[vehicleFromNav][0]
          : "Catálogo";

  return (
    <div className="ra-root">
      <style>{TOKENS}</style>
      {sbOpen && <div className="sb-back" onClick={() => setSbOpen(false)} />}
      <Sidebar
        active={nav}
        go={goNav}
        open={sbOpen}
        close={() => setSbOpen(false)}
        role={role}
        setRole={(r) => {
          setRole(r);
          setNav(ROLES[r].nav[0]);
          setSelectedId(null);
        }}
        onLogout={() => setLogoutOpen(true)}
      />
      <div className="main">
        <Topbar
          onMenu={() => setSbOpen(true)}
          mode={mode}
          title={TITLES[nav][0]}
          subtitle={TITLES[nav][1]}
          q={q}
          setQ={setQ}
          premium={premium}
          setPremium={setPlan}
          onBack={back}
          backLabel={backLabel}
          notifs={notifications}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          onNotifNav={(id) => {
            if (id && ROLES[role].nav.includes(id)) goNav(id);
          }}
          readIds={readIds}
          markAllRead={markAllRead}
          role={role}
          userOpen={userOpen}
          setUserOpen={setUserOpen}
          onGoSettings={() => goNav("settings")}
          onLogout={() => setLogoutOpen(true)}
          hasSettings={ROLES[role].nav.includes("settings")}
        />
        <div className="content">
          {inDetail ? (
            <Detail
              v={vehicle}
              premium={premium}
              track={track}
              fav={favorites.has(vehicle.id)}
              onFav={toggleFav}
              onOpen={openVehicle}
              onUpgrade={() => goNav("subscription")}
              onOpenStore={openStore}
            />
          ) : selectedStore ? (
            <StorePage
              storeId={selectedStore.id}
              premium={premium}
              favorites={favorites}
              onFav={toggleFav}
              onOpenVehicle={openVehicle}
              onBack={back}
              track={track}
            />
          ) : nav === "vehicles" ? (
            <Marketplace
              externalQ={q}
              favorites={favorites}
              onFav={toggleFav}
              onOpen={openVehicle}
              myVehicles={myVehicles}
            />
          ) : nav === "subscription" ? (
            <Subscription
              premium={premium}
              activeCycle={planCycle}
              track={track}
              onSubscribe={subscribe}
              onCancel={cancelPlan}
              goCatalog={() => goNav("vehicles")}
            />
          ) : nav === "opportunities" ? (
            <Opportunities onOpen={openVehicle} />
          ) : nav === "mine" ? (
            <MyVehicles
              list={myVehicles}
              role={role}
              onAdd={addVehicle}
              onUpdate={updateVehicle}
              onStatus={setVehStatus}
              onRemove={removeVehicle}
              onApprove={approveVehicle}
              onReject={rejectVehicle}
              onView={(id) => openVehicle(id, "owner")}
            />
          ) : nav === "leads" ? (
            <Leads leads={leads} vehicles={myVehicles} onContact={contactLead} />
          ) : nav === "funcionarios" ? (
            <Employees
              list={employees}
              onAdd={addEmployee}
              onToggle={toggleEmployee}
              onRemove={removeEmployee}
            />
          ) : nav === "settings" ? (
            <Settings role={role} onLogout={() => setLogoutOpen(true)} />
          ) : (
            <Placeholder id={nav} />
          )}
        </div>
      </div>
      <AnalyticsPanel events={events} open={panelOpen} setOpen={setPanelOpen} />
      <ThemePicker themeId={themeId} setThemeId={setThemeId} />
      {logoutOpen && (
        <div className="ov" onClick={() => setLogoutOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="ra-flex ra-center" style={{ gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "var(--danger-t)",
                  color: "var(--danger)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <LogOut size={20} />
              </div>
              <div className="display" style={{ fontSize: 19, fontWeight: 700 }}>
                Encerrar sessão?
              </div>
            </div>
            <div className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>
              Você precisará entrar novamente para acessar a plataforma.
            </div>
            <div className="ra-flex" style={{ gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setLogoutOpen(false)}>
                Cancelar
              </button>
              <button
                className="btn"
                style={{ background: "var(--danger)", color: "#fff" }}
                onClick={() => {
                  setLogoutOpen(false);
                  doLogout();
                }}
              >
                <LogOut size={15} />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
