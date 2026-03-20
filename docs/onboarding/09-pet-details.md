# Step 9 — Pet Details (Detalhes do Pet)

**Step number:** 9
**Route name:** `pet-details`
**URL:** `/onboarding/pet-details`

---

## Visão Geral

O usuário informa detalhes básicos do pet: idade, sexo e há quanto tempo estão juntos. O título é personalizado com o nome do cliente e o nome do pet coletados nos steps anteriores. Este step absorve também a lógica do Step 11 (`pet-together-since`), que não possui evento de tracking próprio.

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo        | Tipo   | Obrigatório | Validação                               | Máscara |
| ------------ | ------ | :---------: | --------------------------------------- | ------- |
| Idade do pet | Select |     ✅      | Deve selecionar uma opção               | —       |
| Sexo do pet  | Select |     ✅      | Deve selecionar uma opção (macho/fêmea) | —       |
| Tempo juntos | Select |     ✅      | Deve selecionar uma opção               | —       |

---

## Textos da UI

| Elemento              | Texto                                                     |
| --------------------- | --------------------------------------------------------- |
| Título                | Legal! {name}, me conta um pouco sobre o(a) {pet_name}... |
| Subtítulo             | —                                                         |
| CTA (botão principal) | Continuar                                                 |
| CTA secundário        | —                                                         |
| Placeholder(s)        | TODO                                                      |
| Mensagem de erro      | TODO                                                      |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 9,
  step_name: "pet-details",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Continuar" com todos os campos preenchidos
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "pet-details",
  step_number: 9,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: usuário tenta avançar sem preencher todos os campos
window.dataLayer.push({
  event: "form_error",
  step_number: 9,
  step_name: "pet-details",
  error_field: "TODO", // ex: 'age', 'gender', 'together_since'
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                                  | Condição                    |
| ------- | ---------------------------------------- | --------------------------- |
| Próximo | [Step 10 — Pet Breed](./10-pet-breed.md) | Todos os campos preenchidos |
| Voltar  | [Step 8 — Address](./08-address.md)      | —                           |

---

## Regras de Negócio

- O título usa `{name}` (Step 5) e `{pet_name}` (Step 6) para personalização.
- A idade do pet pode ser um fator de precificação — confirmar se impacta o cálculo do plano.
- O sexo do pet pode influenciar coberturas disponíveis (ex: cobertura de castração) — confirmar.
- O campo "tempo juntos" corresponde ao Step 11 (`pet-together-since`) do mapa de steps — não possui evento de tracking próprio e é coletado neste mesmo step.
- Confirmar as opções disponíveis nos selects de idade e tempo juntos (ex: faixas em anos ou meses).

---

## Edge Cases

- Confirmar se há limite de idade máxima para contratação do plano — se sim, verificar se o step bloqueia o avanço ou exibe mensagem específica.
- Verificar comportamento caso `{name}` ou `{pet_name}` não estejam disponíveis (ex: acesso direto à URL).

---

## Notas

- O Step 11 (`pet-together-since`) do mapa de routes não possui URL ou evento de tracking próprio — seus dados são coletados dentro deste step.
- O dataLayer confirma `oldUrl: /onboarding/pet-family` e `newUrl: /onboarding/address`, seguindo o padrão de registro de navegação entre steps.
- Idade, sexo e tempo juntos são dados relevantes para subscrição — verificar se são enviados ao backend ao avançar ou apenas ao final do onboarding.
