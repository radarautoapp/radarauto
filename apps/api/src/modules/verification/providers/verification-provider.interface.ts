/**
 * VerificationProvider
 *
 * Strategy Pattern. Cada implementação cuida de um canal (email ou phone)
 * e um meio de envio (mock, Twilio, Resend, etc).
 */
import type { VerificationChannel } from "@radar/types";

export interface VerificationProvider {
  readonly channel: VerificationChannel;
  readonly name: string;
  send(target: string, code: string): Promise<void>;
}
