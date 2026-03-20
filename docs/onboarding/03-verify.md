# Step 3 — Verify (Verificação OTP)

**Step number:** 3
**Route name:** `verify`
**URL:** `/onboarding/verify`

---

## Visão Geral

O usuário recebe um código OTP no e-mail informado no Step 2 e o insere para autenticar sua identidade. Funciona de forma similar ao Step 18 (`confirm`), mas com o objetivo de **login** em conta existente, e não criação de conta.

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo                 | Tipo                  | Obrigatório | Validação                        | Máscara       |
| --------------------- | --------------------- | :---------: | -------------------------------- | ------------- |
| Código de verificação | Input OTP (6 dígitos) |     ✅      | Código válido enviado por e-mail | `_ _ _ _ _ _` |

---

## Textos da UI

| Elemento              | Texto                                           |
| --------------------- | ----------------------------------------------- |
| Título                | TODO                                            |
| Subtítulo             | TODO (ex: código enviado para e-mail mascarado) |
| CTA (botão principal) | TODO                                            |
| CTA reenvio           | TODO (com countdown)                            |
| CTA alternativo SMS   | TODO                                            |
| Mensagem de erro      | TODO                                            |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 3,
  step_name: "verify",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário confirma o código com sucesso
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "verify",
  step_number: 3,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: código inválido ou expirado
window.dataLayer.push({
  event: "form_error",
  step_number: 3,
  step_name: "verify",
  error_field: "otp_code",
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                               | Condição          |
| ------- | ------------------------------------- | ----------------- |
| Próximo | [Step 4 — Continue](./04-continue.md) | Código OTP válido |
| Voltar  | [Step 2 — Email](./02-email.md)       | —                 |

---

## Regras de Negócio

- O OTP é enviado para o e-mail informado no Step 2.
- Confirmar se há opção de reenvio por SMS, assim como no Step 18.
- Confirmar tempo de expiração do código e número máximo de tentativas.

---

## Edge Cases

- Código expirado: confirmar mensagem de erro e fluxo de reenvio.
- Código incorreto: confirmar número máximo de tentativas e bloqueio de conta.
- Usuário demora para preencher: confirmar se o código expira e qual é o comportamento.

---

## Notas

- Fluxo equivalente ao Step 18 (`confirm`), mas para login em conta existente ao invés de criação de conta.
- TODO — confirmar se dispara evento `login` no dataLayer (padrão GA4) além do `onboarding_step`.
