/**
 * EditLogoModal
 *
 * Modal de upload + crop interativo do logo da loja.
 *
 * Fluxo:
 *  1. Abre vazio com botão "Selecionar arquivo"
 *  2. User escolhe imagem (jpg/png/webp, máx 5MB, mín 200x200)
 *  3. Cropper aparece (aspect 1:1, pinch/zoom/drag)
 *  4. User clica "Salvar" → canvas extrai região cropada → blob JPEG
 *  5. POST multipart pro backend (que processa pra 400x400 WebP)
 *  6. Success splash → fecha
 */
"use client";

import { AlertCircle, ImagePlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@radar/ui";

import { toFriendlyError } from "@/lib/error-messages";
import { storesApi } from "@/lib/stores-api";

import { EditFieldModal, type EditFieldModalSuccess } from "./EditFieldModal";

const ACCEPT_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB no client (backend re-valida)

export interface EditLogoModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditLogoModal({ open, onClose, onUpdated }: EditLogoModalProps): JSX.Element {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<EditFieldModalSuccess | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setError(null);
      setSuccess(null);
      setSaving(false);
    }
  }, [open]);

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ACCEPT_MIMES.includes(file.type)) {
      setError("Formato inválido. Use JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Arquivo muito grande. Máximo ${MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
    });
    reader.readAsDataURL(file);

    // Limpa o input pra permitir selecionar o mesmo arquivo de novo
    e.target.value = "";
  };

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const onSave = async (): Promise<void> => {
    if (!imageSrc || !croppedAreaPixels) return;
    setError(null);
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      await storesApi.uploadLogo(blob, "logo.jpg");
      onUpdated();
      setSuccess({
        title: "Logo atualizado!",
        description: "Seu logo foi salvo com sucesso.",
      });
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(toFriendlyError(err));
      setSaving(false);
    }
  };

  return (
    <EditFieldModal
      open={open}
      title="Logo da loja"
      description={
        imageSrc
          ? "Arraste, dê pinch ou use o slider pra enquadrar."
          : "Escolha uma imagem quadrada de pelo menos 200×200 pixels."
      }
      onClose={onClose}
      successState={success}
    >
      {!imageSrc && (
        <div className="logo-upload-empty">
          <ImagePlus size={48} className="logo-upload-icon" />
          <p>JPEG, PNG ou WebP. Máximo 5 MB.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_MIMES.join(",")}
            onChange={onFileSelected}
            style={{ display: "none" }}
          />
          <Button variant="primary" onClick={() => fileInputRef.current?.click()} disabled={saving}>
            Selecionar arquivo
          </Button>
        </div>
      )}

      {imageSrc && (
        <>
          <div className="logo-crop-area">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="logo-crop-controls">
            <label htmlFor="zoom-range" className="logo-crop-label">
              Zoom
            </label>
            <input
              id="zoom-range"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={saving}
              className="logo-crop-range"
            />
          </div>
        </>
      )}

      {error && (
        <div key={error} className="auth-error" role="alert" style={{ marginTop: 12 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="edit-modal-foot">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        {imageSrc && (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setImageSrc(null);
                setError(null);
              }}
              disabled={saving}
            >
              Trocar imagem
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
              disabled={!croppedAreaPixels || saving}
              loading={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        )}
      </div>
    </EditFieldModal>
  );
}

/**
 * Extrai a região cropada da imagem como Blob JPEG.
 * Backend re-processa pra WebP 400x400.
 */
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
