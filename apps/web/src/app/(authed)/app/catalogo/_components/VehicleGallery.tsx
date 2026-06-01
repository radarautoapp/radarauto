/**
 * VehicleGallery — galeria do detalhe (versão simples e robusta).
 *   <GalleryMain>  : foto principal (na faixa hero, ao lado do card)
 *   <GalleryThumbs>: miniaturas (abaixo do hero, full width)
 *
 * Índice controlado pela página. FREE vê só freePhotoLimit fotos; o resto
 * fica com lock (os dados nem vêm do backend). Lightbox no clique.
 */
"use client";

import { ChevronLeft, ChevronRight, Image as ImageIcon, Lock, Maximize2, X } from "lucide-react";
import { useState } from "react";

import type { VehicleDetail } from "@radar/types";

interface MainProps {
  v: VehicleDetail;
  i: number;
  setI: (n: number) => void;
  onUpgrade: () => void;
}

export function GalleryMain({ v, i, setI, onUpgrade }: MainProps) {
  const [lb, setLb] = useState(false);

  const total = v.photoCount;
  const loaded = v.photos.length;
  const locked = !v.premium && total > loaded && i >= loaded;
  const current = v.photos[i] ?? null;

  const go = (d: number) => {
    if (total <= 0) return;
    setI((i + d + total) % total);
  };

  const openLb = () => {
    if (locked) {
      onUpgrade();
      return;
    }
    if (current) setLb(true);
  };

  // Renderiza o trilho de slides: cada slot é uma foto (ou o lock no fim).
  const slides = Array.from({ length: total }).map((_, idx) => {
    const src = v.photos[idx] ?? null;
    const slotLocked = !v.premium && idx >= loaded;
    return (
      <div className="gslide" key={idx}>
        {slotLocked ? (
          <div className="gmain-lock">
            <div className="lock-c">
              <Lock size={20} />
            </div>
            <div className="gmain-lock-title">Galeria completa é Premium</div>
            <div className="muted gmain-lock-sub">+{total - loaded} fotos bloqueadas</div>
          </div>
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="gmain-img" src={src} alt={`${v.brand} ${v.model} — foto ${idx + 1}`} />
        ) : (
          <div className="gmain-empty">
            <ImageIcon size={48} strokeWidth={1.3} />
            <span>Sem fotos</span>
          </div>
        )}
      </div>
    );
  });

  return (
    <>
      <div className="gmain" onClick={openLb}>
        <div className="gtrack" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides}
        </div>

        {total > 1 && (
          <>
            <button
              className="gnav gnav-l"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Foto anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="gnav gnav-r"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Próxima foto"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        {!locked && total > 0 && (
          <span className="gcount">
            <Maximize2 size={13} />
            {i + 1}/{total}
          </span>
        )}
      </div>

      {lb && current && (
        <div className="glb" onClick={() => setLb(false)}>
          <div className="glb-inner" onClick={(e) => e.stopPropagation()}>
            <button className="glb-close" onClick={() => setLb(false)} aria-label="Fechar">
              <X size={20} />
            </button>
            <div className="glb-viewport">
              <div className="gtrack" style={{ transform: `translateX(-${i * 100}%)` }}>
                {v.photos.map((src, idx) => (
                  <div className="gslide" key={idx}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="glb-img"
                      src={src}
                      alt={`${v.brand} ${v.model} — foto ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            {v.photos.length > 1 && (
              <>
                <button className="gnav gnav-l" onClick={() => go(-1)} aria-label="Anterior">
                  <ChevronLeft size={20} />
                </button>
                <button className="gnav gnav-r" onClick={() => go(1)} aria-label="Próxima">
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface ThumbsProps {
  v: VehicleDetail;
  i: number;
  setI: (n: number) => void;
  onUpgrade: () => void;
}

export function GalleryThumbs({ v, i, setI, onUpgrade }: ThumbsProps) {
  const total = v.photoCount;
  const loaded = v.photos.length;
  if (total <= 1) return null;

  return (
    <div className="gthumbs">
      {Array.from({ length: total }).map((_, idx) => {
        const lk = !v.premium && idx >= loaded;
        const src = v.photos[idx] ?? null;
        return (
          <button
            key={idx}
            className={`gthumb${i === idx ? " on" : ""}`}
            onClick={() => {
              setI(idx);
              if (lk) onUpgrade();
            }}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={`Miniatura ${idx + 1}`} />
            ) : (
              <ImageIcon size={18} />
            )}
            {lk && (
              <span className="gthumb-lock">
                <Lock size={14} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
