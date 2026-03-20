# Step 20 — Summary (Resumo do Plano)

**Step number:** 20
**Route name:** `summary`
**URL:** `/onboarding/summary`

---

## Visão Geral

Step mais complexo do onboarding. Exibe o resumo completo do plano montado pelo usuário, permitindo edição do carrinho (troca de plano, adição/remoção de coberturas adicionais). Ao clicar em "Proteger pet", abre um modal de pagamento com cartão de crédito, campo de cupom de desconto e dados do titular. Ao finalizar o pagamento, o usuário é redirecionado para `/orders/{order-id}` onde o evento `purchase` é disparado.

---

## Screenshot

![Step 20 - Summary](./screenshots/20-summary.png)

---

## Campos — Tela principal

| Campo                        | Tipo                                         | Obrigatório | Validação                                         | Máscara |
| ---------------------------- | -------------------------------------------- | :---------: | ------------------------------------------------- | ------- |
| Seleção de plano             | Card de seleção (Petbee Basic / Petbee Plus) |     ✅      | Deve ter um plano selecionado                     | —       |
| Toggle coberturas adicionais | Switch (toggle)                              |     ❌      | Liga/desliga adicionais (vacina, checkup, dental) | —       |

## Campos — Modal de pagamento ("Proteger pet")

| Campo                   | Tipo       | Obrigatório | Validação          | Máscara               |
| ----------------------- | ---------- | :---------: | ------------------ | --------------------- |
| Cupom de desconto       | Text input |     ❌      | Cupom válido       | —                     |
| Número do cartão        | Text input |     ✅      | Cartão válido      | `0000 0000 0000 0000` |
| Nome impresso no cartão | Text input |     ✅      | Não pode ser vazio | —                     |
| Validade                | Text input |     ✅      | Data válida        | `MM/AA`               |
| Código de segurança     | Text input |     ✅      | CVV válido         | `000`                 |
| CPF do titular          | Text input |     ✅      | CPF válido         | `000.000.000-00`      |

---

## Textos da UI

| Elemento            | Texto                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Título              | Resumo do seu plano                                                                                                                        |
| Subtítulo plano     | Plano da {pet_name}                                                                                                                        |
| Label seleção plano | Selecione o plano ideal para as necessidades do seu pet                                                                                    |
| Plano 1             | Petbee Basic — R$79,90/mês — Proteção básica para o seu pet com cobertura para consultas, exames, internamento e cirurgias                 |
| Plano 2             | Petbee Plus — de R$109,90 por R$99,90/mês — Proteção completa para o seu pet com todas as coberturas do plano básico mais serviços premium |
| CTA principal       | Proteger pet                                                                                                                               |
| CTA adicionar pet   | Incluir novo pet                                                                                                                           |
| Título modal        | Assinar plano com cartão de crédito                                                                                                        |
| Subtítulo modal     | Adicionar cartão de crédito para cobranças futuras                                                                                         |
| CTA cupom aplicar   | REMOVER (quando cupom aplicado)                                                                                                            |
| Mensagem de erro    | TODO                                                                                                                                       |

---

## Eventos / DataLayer

### Pageview + Entrada no step

```javascript
// 1º disparado: begin_checkout — ao entrar no step
// Tags: 05 | FB - InitiateCheckout, 05 | GA4 - begin_checkout, 05 | G - begin_checkout
window.dataLayer.push({
  event: "begin_checkout",
  step_name: "pet-summary", // atenção: step_name vem como 'pet-summary' no dataLayer
  step_number: 19,
  direction: "forward",
  method: "email",
  ecommerce: {
    currency: "BRL",
    coupon: "",
    value: 99.9,
    items: [
      {
        index: 0,
        item_id: "11689",
        item_name: "", // nome do pet
        item_variant: "", // raça do pet
        price: 99.9,
        discount: 0,
      },
    ],
  },
});

// 2º disparado: onboarding_step — ao entrar no step
// Tag: 09 | GA4 - onboarding_step
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "summary",
  step_number: 20,
  direction: "forward",
  method: "email",
});
```

### Edição do carrinho — Adicionar cobertura

```javascript
// Disparado quando: usuário ativa toggle de cobertura adicional
// Tags: 04 | GA4 - add_to_cart, 04 | FB - AddToCart, 04 | G - add_to_cart
window.dataLayer.push({
  event: "add_to_cart",
  step_name: "summary",
  step_number: 20,
  direction: "forward",
  method: "email",
  ecommerce: {
    currency: "BRL",
    value: 99.9,
    items: [
      {
        index: 0,
        item_id: "",
        item_name: "",
        item_variant: "",
        price: 99.9,
        discount: 0,
      },
    ],
  },
  userData: {
    id: "",
    phone: "", // hashed SHA-256
    email: "", // hashed SHA-256
    firstName: "", // hashed SHA-256
    lastName: "", // hashed SHA-256
  },
});
```

### Edição do carrinho — Remover cobertura

```javascript
// Disparado quando: usuário desativa toggle de cobertura adicional
// Tag: 06 | GA4 - remove_from_cart
window.dataLayer.push({
  event: "remove_from_cart",
  step_name: "summary",
  step_number: 20,
  direction: "forward",
  method: "email",
  ecommerce: {
    currency: "BRL",
    value: 119.9,
    items: [
      {
        index: 0,
        item_id: "",
        item_name: "",
        item_variant: "",
        price: 119.9,
        discount: 0,
      },
    ],
  },
  userData: {
    id: "",
    phone: "", // hashed SHA-256
    email: "", // hashed SHA-256
    firstName: "", // hashed SHA-256
    lastName: "", // hashed SHA-256
  },
});
```

### Modal de pagamento — Cupom

```javascript
// Disparado quando: usuário aplica cupom de desconto
// Tag: 10 | GA4 - apply_coupon
window.dataLayer.push({
  event: 'apply_coupon',
  step_name: 'summary',
  step_number: 20,
  direction: 'forward',
  method: 'email',
  coupon_code: 'MYPETSFREE',
  action: 'apply',
  userData: { ... }
});

// Disparado quando: usuário remove cupom de desconto
window.dataLayer.push({
  event: 'apply_coupon',
  step_name: 'summary',
  step_number: 20,
  direction: 'forward',
  method: 'email',
  coupon_code: '',
  action: 'remove',
  userData: { ... }
});
```

### Modal de pagamento — Informações de pagamento

```javascript
// Disparado quando: usuário preenche e confirma os dados do cartão de crédito
// TODO — confirmar tags disparadas no GTM
window.dataLayer.push({
  event: "add_payment_info",
  step_name: "summary",
  step_number: 20,
  direction: "forward",
  method: "email",
  ecommerce: {
    currency: "BRL",
    value: 0, // TODO — confirmar se reflete valor total do plano
    payment_type: "credit_card",
    coupon: "", // TODO — confirmar se cupom aplicado é incluído
    items: [
      {
        // TODO — confirmar estrutura de items
      },
    ],
  },
  userData: {
    id: "",
    phone: "", // hashed SHA-256
    email: "", // hashed SHA-256
    firstName: "", // hashed SHA-256
    lastName: "", // hashed SHA-256
  },
});
```

### Finalização — Purchase

```javascript
// Disparado em: /orders/{order-id} — FORA do onboarding
// Ver documentação da página de confirmação de pedido
window.dataLayer.push({
  event: "purchase",
  // TODO — documentar ao mapear a página /orders/{order-id}
});
```

---

## Lógica de Navegação

| Direção          | Destino                                      | Condição                            |
| ---------------- | -------------------------------------------- | ----------------------------------- |
| Próximo          | `/orders/{order-id}`                         | Pagamento confirmado com sucesso    |
| Incluir novo pet | Step 6 — Pet Name                            | Usuário clica em "Incluir novo pet" |
| Voltar           | [Step 19 — Pet Summary](./19-pet-summary.md) | —                                   |

---

## Regras de Negócio

- Este é o step de checkout — o usuário pode revisar e editar todo o plano antes de pagar.
- A troca de plano (Basic ↔ Plus) e o toggle de coberturas adicionais disparam `add_to_cart` ou `remove_from_cart` a cada interação.
- O modal de pagamento é aberto ao clicar em "Proteger pet" — não é uma nova URL/step.
- O evento `add_payment_info` é disparado quando o usuário preenche e confirma os dados do cartão de crédito no modal.
- O cupom de desconto é aplicado dentro do modal — o evento `apply_coupon` usa `action: 'apply'` ou `action: 'remove'`.
- Os dados do usuário (`userData`) são enviados hasheados em SHA-256 nos eventos de edição de carrinho, cupom e pagamento.
- O evento `purchase` é disparado na página `/orders/{order-id}`, fora do fluxo de onboarding.
- O `begin_checkout` chega com `step_name: 'pet-summary'` e `step_number: 19` no dataLayer — comportamento esperado dado que o evento é disparado na transição do Step 19 para o 20.

---

## Edge Cases

- Cartão recusado: confirmar mensagem de erro exibida no modal e se o usuário pode tentar novamente.
- Cupom inválido ou expirado: confirmar mensagem de erro.
- Usuário fecha o modal sem finalizar: confirmar se o carrinho é preservado.
- Múltiplos pets: confirmar como o resumo exibe e permite editar planos de pets diferentes.
- Confirmar se a troca de plano (Basic ↔ Plus) dispara `remove_from_cart` + `add_to_cart` ou apenas `add_to_cart`.
- Confirmar se o `add_payment_info` é disparado ao preencher o último campo do cartão ou apenas ao submeter o formulário.

---

## Notas

- Este step concentra o maior volume de eventos de ecommerce do funil: `begin_checkout`, `add_to_cart`, `remove_from_cart`, `apply_coupon`, `add_payment_info` e indiretamente o `purchase`.
- Os dados de `userData` são hasheados antes de enviados ao dataLayer — confirmar algoritmo (SHA-256) e quais campos são hasheados.
- O `purchase` ocorre fora do onboarding em `/orders/{order-id}` — documentar separadamente como página de confirmação de pedido.
- O toggle de coberturas adicionais usa o elemento `#pricing-switch` como gatilho no GTM.
- O `add_payment_info` ainda precisa ser validado no GTM DebugView para confirmar tags disparadas e estrutura completa do payload.
