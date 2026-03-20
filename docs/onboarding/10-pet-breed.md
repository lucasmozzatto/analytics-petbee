# Step 10 — Pet Breed (Raça do Pet)

**Step number:** 10
**Route name:** `pet-breed`
**URL:** `/onboarding/pet-breed`

---

## Visão Geral

O usuário informa a raça do pet. Primeiro seleciona se o pet é de raça pura ou sem raça definida (SRD), e em seguida escolhe a raça específica em um dropdown filtrado pela seleção anterior e pela espécie informada no Step 7.

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo        | Tipo                                    | Obrigatório | Validação                                                  | Máscara |
| ------------ | --------------------------------------- | :---------: | ---------------------------------------------------------- | ------- |
| Tipo de raça | Seleção (Raça pura / Sem raça definida) |     ✅      | Deve selecionar uma opção                                  | —       |
| Raça         | Dropdown (condicional)                  |     ✅      | Habilitado após seleção do tipo; deve selecionar uma opção | —       |

---

## Textos da UI

| Elemento              | Texto                                 |
| --------------------- | ------------------------------------- |
| Título                | Obrigado! E qual a raça dela ou dele? |
| Subtítulo             | —                                     |
| Opção 1               | Raça pura                             |
| Opção 2               | Sem raça definida                     |
| CTA (botão principal) | Continuar                             |
| CTA secundário        | —                                     |
| Placeholder dropdown  | TODO                                  |
| Mensagem de erro      | TODO                                  |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 10,
  step_name: "pet-breed",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Continuar" com raça selecionada
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "pet-breed",
  step_number: 10,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: usuário tenta avançar sem selecionar tipo de raça ou raça
window.dataLayer.push({
  event: "form_error",
  step_number: 10,
  step_name: "pet-breed",
  error_field: "TODO", // ex: 'breed_type', 'breed'
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                                                    | Condição                         |
| ------- | ---------------------------------------------------------- | -------------------------------- |
| Próximo | [Step 11 — Pet Together Since](./11-pet-together-since.md) | Tipo de raça e raça selecionados |
| Voltar  | [Step 9 — Pet Details](./09-pet-details.md)                | —                                |

---

## Regras de Negócio

- O dropdown de raças é filtrado com base em dois critérios: **espécie** (Step 7) e **tipo de raça** (raça pura vs. SRD).
- Quando selecionado **"Sem raça definida"**, o dropdown pode exibir apenas a opção "SRD" ou ser ocultado — confirmar comportamento.
- A raça pode ser um fator de subscrição e precificação — confirmar se raças específicas têm restrições ou preços diferenciados.

---

## Edge Cases

- Confirmar se há raças bloqueadas para contratação (ex: raças consideradas de alto risco).
- Verificar se o dropdown é buscável (typeahead) ou apenas scroll — relevante para listas longas de raças.
- Confirmar comportamento ao voltar para este step: os valores selecionados devem ser preservados.

---

## Notas

- O dataLayer confirma `oldUrl: /onboarding/address` e `newUrl: /onboarding/pet-details`, seguindo o padrão de registro de navegação entre steps.
- A lista de raças disponíveis deve estar alinhada com o catálogo de subscrição da Petbee — verificar fonte de dados (hardcoded, API, CMS).
