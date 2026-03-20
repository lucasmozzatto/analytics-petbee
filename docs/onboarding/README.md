# Convenções de Tracking — Onboarding Petbee

Este documento descreve os padrões e comportamentos globais de tracking que se aplicam a todos os steps do onboarding.

---

## Padrão do evento `onboarding_step`

Todos os steps disparam o evento `onboarding_step` ao avançar ou retroceder. A estrutura base é:

```javascript
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "nome-do-step",
  step_number: N,
  direction: "forward" | "backward",
});
```

### Parâmetros

| Parâmetro     | Tipo   | Descrição                                                              |
| ------------- | ------ | ---------------------------------------------------------------------- |
| `step_name`   | string | Route name do step (ex: `'customer'`, `'coverage'`)                    |
| `step_number` | number | Número do step no mapa de onboarding                                   |
| `direction`   | string | `'forward'` ao avançar, `'backward'` ao retroceder                     |
| `method`      | string | Presente a partir do Step 18 — indica canal de verificação (`'email'`) |

---

## Navegação backward (retroceder)

Quando o usuário clica em voltar, o mesmo evento `onboarding_step` é disparado com `direction: 'backward'`.

```javascript
// Disparado quando: usuário retrocede um step
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "nome-do-step-destino",
  step_number: N,
  direction: "backward",
});
```

### Características do evento de retrocesso

- O `historyChangeSource` pode ser `'replaceState'` ao invés de `'pushState'` em alguns casos — confirmar padrão por step.
- A `oldUrl` e `newUrl` no dataLayer refletem a navegação real do browser.
- Os dados preenchidos pelo usuário são preservados ao retroceder.

---

## Tags globais disparadas em todos os steps

| Tag                           | Ferramenta         | Trigger                  |
| ----------------------------- | ------------------ | ------------------------ |
| `09 \| GA4 - onboarding_step` | Google Analytics 4 | Evento `onboarding_step` |

---

## Tags disparadas apenas na entrada do funil (Step 1)

| Tag                            | Ferramenta                     |
| ------------------------------ | ------------------------------ |
| `00 \| Tag do Google`          | Google Tag                     |
| `01 \| FB - PageView`          | Meta Pixel                     |
| `Conversion Linker`            | Google Ads                     |
| `01 \| GA4 - page_view`        | Google Analytics 4             |
| `01 \| G - PageView`           | Google Ads Conversion Tracking |
| `Microsoft Clarity - Official` | Microsoft Clarity              |

---

## Tags de scroll (todos os steps)

Disparadas nos marcos de scroll 25%, 50%, 75% e 90% (vertical):

| Tag                  | Ferramenta         |
| -------------------- | ------------------ |
| `98 \| GA4 - Scroll` | Google Analytics 4 |
| `98 \| FB - Scroll`  | Meta Pixel         |

---

## Mapa de eventos por step

| Step | Route                         | Eventos disparados                                                                                         |
| ---- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1    | `account`                     | `onboarding_step`, `onboarding_step_view`, pageview tags _(TODO: adicionar disparo de `onboarding_step` no GTM)_ |
| 5    | `customer`                    | `onboarding_step`                                                                                          |
| 6    | `pet-name`                    | `onboarding_step`                                                                                          |
| 7    | `pet-family`                  | `onboarding_step`                                                                                          |
| 8    | `address`                     | `onboarding_step`                                                                                          |
| 9    | `pet-details`                 | `onboarding_step`                                                                                          |
| 10   | `pet-breed`                   | `onboarding_step`                                                                                          |
| 11   | `pet-together-since`          | _(incorporado ao Step 9)_                                                                                  |
| 12   | `diseases`                    | _(desativado)_                                                                                             |
| 13   | `coverage`                    | `onboarding_step`, `add_to_cart`                                                                           |
| 14   | `additional-coverage-vaccine` | `onboarding_step`                                                                                          |
| 15   | `additional-coverage-checkup` | `onboarding_step`                                                                                          |
| 16   | `additional-coverage-dental`  | `onboarding_step`                                                                                          |
| 17   | `register`                    | `onboarding_step`                                                                                          |
| 18   | `confirm`                     | `onboarding_step`, `sign_up`                                                                               |
| 19   | `pet-summary`                 | `onboarding_step`                                                                                          |
| 20   | `summary`                     | `onboarding_step`, `begin_checkout`, `add_to_cart`, `remove_from_cart`, `apply_coupon`, `add_payment_info` |
| —    | `/orders/{order-id}`          | `purchase` _(fora do onboarding)_                                                                          |

---

## Infraestrutura de tracking

| Item          | Valor          |
| ------------- | -------------- |
| GTM Container | `GTM-MDQW36CD` |
| GA4 Property  | `G-2JJF42SV7J` |
| Google Ads    | `AW-659356856` |

---

## Notas

- O `userData` com dados hasheados em SHA-256 passa a ser enviado nos eventos a partir do Step 20, após o usuário estar autenticado.
- Steps 2, 3 e 4 (`email`, `verify`, `continue`) pertencem ao fluxo de usuários **com conta existente** (Step 1 → "Sim").
- Fluxo novo cliente: 1 → 5 → 6 → 7 → 8 → 9 → 10 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20
- Fluxo cliente existente (novo pet): 1 → 2 → 3 → 4 → 6 → 7 → 9 → 10 → 13 → 14 → 15 → 16 → 19 → 20
- O evento `purchase` ocorre fora do onboarding na página `/orders/{order-id}` — documentar separadamente.
