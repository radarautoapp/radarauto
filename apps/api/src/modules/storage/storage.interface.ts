/**
 * IStorageService
 *
 * Interface pra abstrair onde os arquivos são armazenados.
 * Implementações: LocalStorageProvider (dev), SupabaseStorageProvider (prod).
 *
 * Strategy pattern — mesma técnica do CnpjModule (Regra 11/13).
 */

export interface UploadOptions {
  /** Key/path do arquivo no storage. Ex: "logos/abc-123.webp" */
  key: string;
  /** Buffer do arquivo já processado (redimensionado, otimizado) */
  buffer: Buffer;
  /** MIME type final. Default: image/webp */
  contentType?: string;
}

export interface UploadResult {
  /** URL pública pronta pra usar em <img src> */
  url: string;
  /** Key usada (mesma do input) */
  key: string;
}

export interface IStorageService {
  /**
   * Faz upload. Sobrescreve se a key já existir.
   * Retorna a URL pública.
   */
  upload(opts: UploadOptions): Promise<UploadResult>;

  /**
   * Apaga arquivo pela key. Não lança erro se não existir.
   */
  delete(key: string): Promise<void>;

  /**
   * Extrai a key (ex: "logos/abc-123.webp") a partir de uma URL pública.
   * Necessário pra deletar arquivos antigos quando só temos a URL salva no DB.
   */
  extractKey(url: string): string | null;
}

export const STORAGE_SERVICE = Symbol("STORAGE_SERVICE");
