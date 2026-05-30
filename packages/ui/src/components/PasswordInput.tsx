/**
 * PasswordInput
 *
 * Input de senha com toggle visual (Eye/EyeOff).
 * Encapsula:
 *   - Estado local de visibilidade (não vaza pra fora)
 *   - Acessibilidade: aria-label dinâmico, aria-pressed
 *   - Foco mantido no input ao clicar no botão (preventDefault no mousedown)
 *   - Estados disabled/invalid herdados
 *
 * API: extende as props do Input base.
 *
 * Exemplo:
 *   <PasswordInput
 *     id="senha"
 *     value={pw}
 *     onChange={(e) => setPw(e.target.value)}
 *     placeholder="••••••••"
 *     minLength={8}
 *     required
 *     autoComplete="new-password"
 *   />
 */
"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

import { Input, type InputProps } from "./Input";

export type PasswordInputProps = Omit<InputProps, "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ disabled, className, ...rest }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className={`pw-wrap ${className ?? ""}`}>
        <Input ref={ref} type={visible ? "text" : "password"} disabled={disabled} {...rest} />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setVisible((v) => !v)}
          onMouseDown={(e) => e.preventDefault()}
          disabled={disabled}
          aria-label={visible ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    );
  },
);
