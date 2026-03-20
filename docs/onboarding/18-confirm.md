# Step 18 — Confirm (Confirmação de Identidade)

**Step number:** 18
**Route name:** `confirm`
**URL:** `/onboarding/confirm`

---

## Visão Geral

O usuário confirma sua identidade por meio de um código de verificação enviado para o e-mail cadastrado no Step 17. É possível reenviar o código por e-mail (com countdown) ou solicitar envio por SMS. Este step dispara dois eventos simultâneos: `sign_up` e `onboarding_step`.

---

## Screenshot

![Step 18 - Confirm](./screenshots/18-confirm.png)

---

## Campos

| Campo                 | Tipo                  | Obrigatório | Validação                               | Máscara       |
| --------------------- | --------------------- | :---------: | --------------------------------------- | ------------- |
| Código de verificação | Input OTP (6 dígitos) |     ✅      | Código válido enviado por e-mail ou SMS | `_ _ _ _ _ _` |

---

## Textos da UI

| Elemento              | Texto                                              |
| --------------------- | -------------------------------------------------- |
| Título                | Agora precisamos confirmar sua identidade :)       |
| Subtítulo             | Acabei de enviar um código para lu\*\*\*@gmail.com |
| CTA (botão principal) | Continuar                                          |
| CTA reenvio e-mail    | REENVIAR (285) — countdown em segundos             |
| CTA alternativo       | ENVIAR CÓDIGO POR SMS                              |
| Mensagem de erro      | TODO                                               |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 18,
  step_name: "confirm",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário confirma o código com sucesso
// Tags disparadas:
//   - 99 | GA4 - sign_up (Google Analytics: GA4 Event - Succeeded)
//   - 99 | FB - CompleteRegistration (Meta Pixel - Succeeded)
window.dataLayer.push({
  event: "sign_up",
  step_name: "confirm",
  step_number: 18,
  direction: "forward",
  method: "email",
});

// Disparado simultaneamente ao sign_up
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "confirm",
  step_number: 18,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: código inválido ou expirado
window.dataLayer.push({
  event: "form_error",
  step_number: 18,
  step_name: "confirm",
  error_field: "otp_code",
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                                      | Condição                      |
| ------- | -------------------------------------------- | ----------------------------- |
| Próximo | [Step 19 — Pet Summary](./19-pet-summary.md) | Código confirmado com sucesso |
| Voltar  | [Step 17 — Register](./17-register.md)       | —                             |

---

## Regras de Negócio

- O código é enviado automaticamente para o e-mail informado no Step 17 ao entrar neste step.
- O e-mail é mascarado na UI (ex: `lu***@gmail.com`) para preservar privacidade.
- O botão "REENVIAR" possui um countdown em segundos — confirmar tempo total do timer (no exemplo: 285s).
- O usuário pode optar por receber o código via SMS como alternativa ao e-mail.
- O botão "Continuar" fica desabilitado (`Mui-disabled`) até o código ser preenchido corretamente.
- Este step dispara o evento `sign_up` — marco de criação de conta no sistema da Petbee.

---

## Edge Cases

- Código expirado: confirmar mensagem de erro e se o reenvio é automático ou manual.
- Código incorreto: confirmar número máximo de tentativas e comportamento após esgotar tentativas.
- Usuário solicita SMS mas não recebe: confirmar fluxo de suporte.
- Verificar comportamento caso o usuário volte ao Step 17 e altere o e-mail — novo código deve ser gerado.

---

## Notas

- Este step marca o evento `sign_up` — a partir daqui o usuário está formalmente registrado.
- Tags disparadas: **99 | GA4 - sign_up** e **99 | FB - CompleteRegistration** (Meta Pixel).
- O `method: 'email'` no dataLayer indica o canal de verificação utilizado — pode ser `'sms'` caso o usuário opte pelo SMS.
- O dataLayer confirma `oldUrl: /onboarding/additional-coverage-dental` → `newUrl: /onboarding/register` → `newUrl: /onboarding/confirm`, seguindo o padrão de navegação entre steps.
