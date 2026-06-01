/**
 * usePageTime
 *
 * Mede o tempo que o usuário passa com a página VISÍVEL (pausa ao trocar de
 * aba/minimizar) e envia o total uma vez, ao sair (desmontar ou fechar a aba).
 *
 * Usado pelo engine de leads para o sinal de engajamento (tempo na tela).
 *
 * @param vehicleId  id do veículo sendo visto (null = não mede)
 * @param onFlush    callback que recebe o total de segundos para enviar
 */
import { useEffect, useRef } from "react";

export function usePageTime(
  vehicleId: string | null | undefined,
  onFlush: (vehicleId: string, seconds: number) => void,
): void {
  // Refs evitam re-render e mantêm valor entre os listeners.
  const accumulatedMs = useRef(0);
  const segmentStart = useRef<number | null>(null);
  const flushed = useRef(false);

  useEffect(() => {
    if (!vehicleId) return;

    accumulatedMs.current = 0;
    segmentStart.current = document.visibilityState === "visible" ? Date.now() : null;
    flushed.current = false;

    // Fecha o segmento atual (visível) somando ao acumulador.
    const closeSegment = (): void => {
      if (segmentStart.current !== null) {
        accumulatedMs.current += Date.now() - segmentStart.current;
        segmentStart.current = null;
      }
    };

    const onVisibility = (): void => {
      if (document.visibilityState === "visible") {
        segmentStart.current = Date.now();
      } else {
        closeSegment();
        // Aba escondida: bom momento para um flush de segurança.
        flush();
      }
    };

    // Envia o total acumulado (uma vez). seconds arredondado.
    const flush = (): void => {
      closeSegment();
      const seconds = Math.round(accumulatedMs.current / 1000);
      // só envia se houve tempo relevante e ainda não enviou este montante
      if (seconds >= 2 && !flushed.current) {
        flushed.current = true;
        onFlush(vehicleId, seconds);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      // Saiu da página (navegou para outra rota): envia o total.
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);
}
