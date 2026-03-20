# Step 1 — Account (Criação de Conta)

**Step number:** 1
**Route name:** `account`
**URL:** `/onboarding/account`

---

## Visão Geral

Porta de entrada do funil de onboarding. O usuário indica se já possui conta na Petbee ou não. Esta é a primeira interação do lead com o fluxo de contratação de plano.

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo         | Tipo                     | Obrigatório | Validação                      | Máscara |
| ------------- | ------------------------ | :---------: | ------------------------------ | ------- |
| Possui conta? | Radio / Botão de seleção |     ✅      | Deve selecionar uma das opções | —       |

---

## Textos da UI

| Elemento         | Texto                                |
| ---------------- | ------------------------------------ |
| Título           | Olá, você já possui conta na Petbee? |
| Subtítulo        | —                                    |
| CTA opção 1      | Sim                                  |
| CTA opção 2      | Não                                  |
| Mensagem de erro | —                                    |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 1,
  step_name: "account",
});
```

### Tags disparadas no carregamento da página

No evento `Container Loaded`, as seguintes tags são disparadas automaticamente:

- **01 | FB - PageView** — Meta Pixel
- **Conversion Linker** — Google Ads
- **01 | GA4 - page_view** — Google Analytics 4
- **01 | G - PageView** — Google Ads Conversion Tracking
- **Microsoft Clarity - Official**

### Evento(s) de Ação

```javascript
// Disparado quando: usuário seleciona "Sim" (já possui conta)
window.dataLayer.push({
  event: "onboarding_account_existing",
  step_number: 1,
  step_name: "account",
  has_account: true,
});

// Disparado quando: usuário seleciona "Não" (novo lead)
window.dataLayer.push({
  event: "onboarding_account_new",
  step_number: 1,
  step_name: "account",
  has_account: false,
});
```

### Eventos de Scroll

```javascript
// Disparado nos marcos de scroll (25%, 50%, 75%, 90%)
// Tags: 98 | GA4 - Scroll, 98 | FB - Scroll
dataLayer.push({ event: "gtm.scrollDepth", ... })
```

---

## Lógica de Navegação

| Direção       | Destino                               | Condição                                                                                           |
| ------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Próximo (Não) | [Step 5 — Customer](./05-customer.md) | Usuário não possui conta → pula para o 5 e segue fluxo de criação                                  |
| Próximo (Sim) | TODO — fluxo de login/retomada        | Usuário já possui conta → redireciona para [Step 2 — Customer](./02-email.md) login ou continuação |
| Voltar        | —                                     | Primeiro step                                                                                      |

---

## Regras de Negócio

- Este step é a porta de entrada do funil; todos os leads novos passam por aqui.
- Se o usuário selecionar **"Sim"**, o fluxo de onboarding padrão pode ser interrompido e redirecionado para login ou recuperação de sessão. _(confirmar comportamento)_
- As tags de pageview (GA4, Meta Pixel, Google Ads, Clarity) são disparadas automaticamente ao carregar o step.

---

## Edge Cases

- Usuário que já possui conta e tenta iniciar um novo onboarding: definir se redireciona para login ou permite continuar.
- Comportamento em caso de sessão ativa: verificar se o step é exibido ou se o usuário é redirecionado automaticamente.

---

## Notas

- GTM container: `GTM-MDQW36CD`
- GA4 property: `G-2JJF42SV7J`
- Google Ads: `AW-659356856`
- Este step corresponde ao evento de entrada do funil (`generate_lead` pode ser associado ao avanço deste step — confirmar).
