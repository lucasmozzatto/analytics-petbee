# Step 13 — Coverage (Plano de Cobertura)

**Step number:** 13
**Route name:** `coverage`
**URL:** `/onboarding/coverage`

---

## Visão Geral

O usuário seleciona o plano de urgência e emergência desejado. São exibidos cards com as opções de plano disponíveis, contendo informações de cobertura e preço. É neste step que ocorre o primeiro evento de ecommerce do funil (`add_to_cart`).

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo             | Tipo            | Obrigatório | Validação                                 | Máscara |
| ----------------- | --------------- | :---------: | ----------------------------------------- | ------- |
| Plano selecionado | Card de seleção |     ✅      | Deve selecionar um dos planos disponíveis | —       |

---

## Textos da UI

| Elemento              | Texto                                                                            |
| --------------------- | -------------------------------------------------------------------------------- |
| Título                | Selecione qual plano de urgência e emergência você prefere.                      |
| Subtítulo             | Se a {pet_name} apresentar algum sintoma, você poderá contar com nosso serviço   |
| CTA (botão principal) | Continuar                                                                        |
| CTA secundário        | —                                                                                |
| Opções                | Cards com nome do plano, coberturas e preço (TODO — detalhar planos disponíveis) |
| Mensagem de erro      | TODO                                                                             |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 13,
  step_name: "coverage",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Continuar" após selecionar um plano
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "coverage",
  step_number: 13,
  direction: "forward",
});

// Disparado simultaneamente ao onboarding_step
// Tags disparadas:
//   - 04 | GA4 - add_to_cart (Google Analytics: GA4 Event - Succeeded)
//   - 04 | FB - AddToCart (Meta Pixel - Succeeded)
//   - 04 | G - add_to_cart (Google Ads Conversion Tracking - Succeeded)
window.dataLayer.push({
  event: "add_to_cart",
  step_name: "coverage",
  step_number: 13,
  direction: "forward",
  ecommerce: {
    currency: "BRL",
    value: 0, // preenchido com o valor do plano selecionado
    items: [
      {
        index: 0,
        item_id: "", // ID do plano selecionado
        item_name: "", // nome do plano selecionado
        item_variant: "", // variante (ex: nome da cobertura)
        price: 0, // preço do plano
        discount: 0,
      },
    ],
  },
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: usuário tenta avançar sem selecionar um plano
window.dataLayer.push({
  event: "form_error",
  step_number: 13,
  step_name: "coverage",
  error_field: "plan",
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                                                                      | Condição          |
| ------- | ---------------------------------------------------------------------------- | ----------------- |
| Próximo | [Step 14 — Additional Coverage Vaccine](./14-additional-coverage-vaccine.md) | Plano selecionado |
| Voltar  | [Step 10 — Pet Breed](./10-pet-breed.md)                                     | —                 |

---

## Regras de Negócio

- Este é o primeiro step com evento de ecommerce — o `add_to_cart` é disparado junto com o `onboarding_step` ao clicar em "Continuar".
- O subtítulo usa `{pet_name}` (Step 6) para personalização.
- Os planos exibidos podem variar conforme espécie, raça, idade e endereço coletados nos steps anteriores — confirmar.
- O `value` e `price` no evento `add_to_cart` devem refletir o valor real do plano selecionado — no dataLayer de exemplo estão zerados (dados de teste).

---

## Edge Cases

- Confirmar se o botão "Continuar" fica desabilitado até um plano ser selecionado.
- Verificar comportamento ao voltar para este step: o plano previamente selecionado deve ser preservado.
- Confirmar se há planos indisponíveis para determinadas raças, idades ou regiões.

---

## Notas

- Este step marca a entrada do lead no funil de ecommerce — a partir daqui os eventos seguem o padrão GA4 Enhanced Ecommerce.
- GTM container: `GTM-MDQW36CD` | GA4: `G-2JJF42SV7J` | Google Ads: `AW-659356856`
- Os dados de `item_id`, `item_name` e `item_variant` no dataLayer de teste estão com valores placeholder — confirmar estrutura real com o time de produto.
