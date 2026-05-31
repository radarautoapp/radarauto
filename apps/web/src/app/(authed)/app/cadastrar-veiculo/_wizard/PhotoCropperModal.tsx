/**
 * PhotoCropperModal
 *
 * Modal de corte 4:3 pra UMA foto do veículo. Reusa o padrão do EditLogoModal
 * (react-easy-crop + getCroppedBlob via canvas).
 *
 * Fluxo: recebe um File (imageSrc dataURL) → usuário enquadra 4:3 →
 * onConfirm devolve o Blob cropado (JPEG), que o wizard guarda como File.
 *
 * O backend ainda reprocessa pra webp 1280x960, mas cortar no client dá
 * controle de enquadramento ao usuário.
 */
"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@radar/ui";

export interface PhotoCropperModalProps {
  /** dataURL da imagem a cortar */
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

export function PhotoCropperModal({
  imageSrc,
  onCancel,
  onConfirm,
}: PhotoCropperModalProps): JSX.Element {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async (): Promise<void> => {
    if (!croppedAreaPixels) return;
    setWorking(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="vwz-cropper-backdrop" role="dialog" aria-modal="true">
      <div className="vwz-cropper-modal">
        <div className="vwz-cropper-head">
          <h3>Enquadre a foto</h3>
          <p className="muted">Arraste, dê zoom e ajuste no formato 4:3.</p>
        </div>

        <div className="vwz-cropper-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="vwz-cropper-controls">
          <label htmlFor="photo-zoom" className="micro">
            Zoom
          </label>
          <input
            id="photo-zoom"
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            disabled={working}
            className="vwz-cropper-range"
          />
        </div>

        <div className="vwz-cropper-foot">
          <Button variant="ghost" onClick={onCancel} disabled={working}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!croppedAreaPixels || working}
            loading={working}
          >
            {working ? "Processando..." : "Adicionar foto"}
          </Button>
        </div>
      </div>
    </div>
  );
}

async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não disponível");

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob retornou null"));
      },
      "image/jpeg",
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("Falha ao carregar imagem")));
    img.src = src;
  });
}
