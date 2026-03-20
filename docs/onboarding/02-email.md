# Step 2 — Email (Login por E-mail)

**Step number:** 2
**Route name:** `email`
**URL:** `/onboarding/email`

---

## Visão Geral

Exibido para usuários que já possuem conta na Petbee (Step 1 → "Sim"). O usuário informa seu e-mail cadastrado para localizar a conta existente e iniciar o fluxo de login.

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->
TODO

---

## Campos

| Campo | Tipo | Obrigatório | Validação | Máscara |
|-------|------|:-----------:|-----------|---------|
| E-mail | Text input (email) | ✅ | Formato de e-mail válido | — |

---

## Textos da UI

| Elemento | Texto |
|----------|-------|
| Título | TODO |
| Subtítulo | TODO |
| CTA (botão principal) | TODO |
| Placeholder e-mail | TODO |
| Mensagem de erro | TODO |

---

## Eventos / DataLayer

### Pageview
```javascriptwindow.dataLayer.push({
event: 'onboarding_step_view',
step_number: 2,
step_name: 'email'
});

### Evento(s) de Ação
```javascript// Disparado quando: usuário clica em continuar com e-mail preenchido
window.dataLayer.push({
event: 'onboarding_step',
step_name: 'email',
step_number: 2,
direction: 'forward'
});

### Eventos de Erro (se aplicável)
```javascript// Disparado quando: e-mail inválido ou não encontrado na base
window.dataLayer.push({
event: 'form_error',
step_number: 2,
step_name: 'email',
error_field: 'email',
error_message: 'TODO'
});

---

## Lógica de Navegação

| Direção | Destino | Condição |
|---------|---------|----------|
| Próximo | [Step 3 — Verify](./03-verify.md) | E-mail encontrado na base |
| Voltar | [Step 1 — Account](./01-account.md) | — |

---

## Regras de Negócio

- Acessado apenas por usuários que selecionaram **"Sim"** no Step 1 (já possuem conta).
- O e-mail informado deve existir na base de clientes Petbee — confirmar mensagem de erro caso não seja encontrado.
- Confirmar se é enviado automaticamente um OTP ao e-mail ao avançar, ou se isso ocorre apenas no Step 3.

---

## Edge Cases

- E-mail não cadastrado: confirmar se exibe erro ou redireciona para o fluxo de criação de conta.
- E-mail cadastrado mas com conta inativa/cancelada: confirmar comportamento.

---

## Notas

- TODO — confirmar se dispara evento `onboarding_step` ou evento próprio de login.