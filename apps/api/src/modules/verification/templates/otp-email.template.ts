/**
 * Template do email de verificação (OTP) do RadarAuto.
 *
 * HTML inline-styled (compatível com Gmail/Outlook/Apple Mail — clientes de
 * email não suportam <style> externo nem muitas regras modernas). A logo é
 * carregada por URL pública (PNG, pois Gmail não renderiza SVG).
 * Paleta da marca: azul #185de8 / azul-escuro #021027 / laranja #fe5400.
 */

/** URL pública da logo (servida pelo front em produção). */
const LOGO_URL = "https://www.radarauto.app/logo-email.png";

export interface OtpEmail {
  subject: string;
  html: string;
  text: string;
}

export function otpEmailTemplate(code: string): OtpEmail {
  const subject = "Seu código de verificação RadarAuto";

  const text =
    `RadarAuto\n\n` +
    `Seu código de verificação é: ${code}\n\n` +
    `Ele expira em 10 minutos. Se você não solicitou este código, ignore este email.\n`;

  const spacedCode = code.split("").join("&nbsp;&nbsp;");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(2,16,39,0.08);">
          <!-- Header com a logo -->
          <tr>
            <td style="background-color:#021027; padding:26px 32px; text-align:center;">
              <img src="${LOGO_URL}" alt="RadarAuto" height="30" style="height:30px; width:auto; display:inline-block; border:0;" />
            </td>
          </tr>
          <!-- Corpo -->
          <tr>
            <td style="padding:40px 32px 32px;">
              <h1 style="margin:0 0 8px; font-size:20px; font-weight:700; color:#021027; text-align:center;">Verifique seu email</h1>
              <p style="margin:0 0 32px; font-size:15px; line-height:1.5; color:#64748b; text-align:center;">
                Use o código abaixo para concluir seu cadastro no RadarAuto.
              </p>
              <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:24px; text-align:center; margin-bottom:32px;">
                <div style="font-size:34px; font-weight:700; color:#185de8; letter-spacing:6px; font-family:'Courier New',Courier,monospace;">
                  ${spacedCode}
                </div>
              </div>
              <p style="margin:0; font-size:13px; line-height:1.6; color:#94a3b8; text-align:center;">
                Este código expira em <strong style="color:#64748b;">10 minutos</strong>.<br>
                Se você não solicitou, pode ignorar este email com segurança.
              </p>
            </td>
          </tr>
          <!-- Rodapé -->
          <tr>
            <td style="padding:24px 32px; border-top:1px solid #f1f5f9; text-align:center;">
              <p style="margin:0; font-size:12px; color:#cbd5e1;">
                © RadarAuto · Inteligência automotiva premium
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
