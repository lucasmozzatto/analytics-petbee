# Step 5 — Customer (Dados do Cliente)

**Step number:** 5
**Route name:** `customer`
**URL:** `/onboarding/customer`

---

## Visão Geral

Primeiro step de coleta de dados do usuário. O lead informa seu nome e sobrenome para personalizar a experiência do onboarding. É o ponto de entrada para leads sem conta (vindo do Step 1 → "Não").

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo     | Tipo       | Obrigatório | Validação          | Máscara |
| --------- | ---------- | :---------: | ------------------ | ------- |
| Nome      | Text input |     ✅      | Não pode ser vazio | —       |
| Sobrenome | Text input |     ✅      | Não pode ser vazio | —       |

---

## Textos da UI

| Elemento              | Texto                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Título                | Em menos de 1 minuto teremos tudo pronto para proteger seus pets! Para começar, qual é o seu nome? |
| Subtítulo             | —                                                                                                  |
| CTA (botão principal) | Continuar                                                                                          |
| CTA secundário        | —                                                                                                  |
| Placeholder(s)        | TODO                                                                                               |
| Mensagem de erro      | TODO                                                                                               |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 5,
  step_name: "customer",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Continuar"
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "customer",
  step_number: 5,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: TODO (ex: campo nome/sobrenome vazio)
window.dataLayer.push({
  event: "form_error",
  step_number: 5,
  step_name: "customer",
  error_field: "TODO",
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                               | Condição                            |
| ------- | ------------------------------------- | ----------------------------------- |
| Próximo | [Step 6 — Pet Name](./06-pet-name.md) | Campos nome e sobrenome preenchidos |
| Voltar  | [Step 1 — Account](./01-account.md)   | —                                   |

---

## Regras de Negócio

- Acessado apenas por usuários que selecionaram **"Não"** no Step 1 (sem conta existente).
- O evento `onboarding_step` é disparado ao clicar em "Continuar", com `direction: 'forward'`.
- A tag **09 | GA4 - onboarding_step** é responsável por registrar a progressão entre steps no GA4.

---

## Edge Cases

- Usuário tenta avançar sem preencher nome ou sobrenome: exibir mensagem de erro. _(confirmar texto da mensagem)_
- Verificar se aceita caracteres especiais, acentos e nomes compostos.

---

## Notas

- O padrão de evento `onboarding_step` com `step_name` e `step_number` se repete nos demais steps — a tag **09 | GA4 - onboarding_step** é o mecanismo central de tracking de progressão do funil.
- Steps 2, 3 e 4 (`email`, `verify`, `continue`) são parte do fluxo de usuários **com conta existente** (Step 1 → "Sim"). Documentar separadamente.
