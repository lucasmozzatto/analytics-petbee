# Step 14 — Additional Coverage Vaccine (Cobertura Adicional de Vacinas)

**Step number:** 14
**Route name:** `additional-coverage-vaccine`
**URL:** `/onboarding/additional-coverage-vaccine`

---

## Visão Geral

O usuário decide se deseja adicionar a cobertura adicional de vacinas ao plano selecionado no Step 13. O step apresenta as coberturas incluídas e o valor adicional mensal. O usuário pode aceitar ou recusar a cobertura.

---

## Screenshot

![Step 14 - Additional Coverage Vaccine](./screenshots/14-additional-coverage-vaccine.png)

---

## Campos

| Campo                          | Tipo                            | Obrigatório | Validação                     | Máscara |
| ------------------------------ | ------------------------------- | :---------: | ----------------------------- | ------- |
| Adicionar cobertura de vacinas | Botão de ação (aceitar/recusar) |     ✅      | Deve clicar em uma das opções | —       |

---

## Textos da UI

| Elemento              | Texto                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| Título                | A cobertura de vacinas é popular entre os pais de pets. Gostaria de adicioná-las? |
| Subtítulo             | —                                                                                 |
| Nome do adicional     | Adicional de Vacinas                                                              |
| Cobertura 1           | Múltipla V8/V10                                                                   |
| Cobertura 2           | Múltipla V4/V5                                                                    |
| Cobertura 3           | Antirrábica (Raiva)                                                               |
| Cobertura 4           | Cobertura nacional por reembolso                                                  |
| CTA (botão principal) | Adicionar (+R$20,00/MÊS)                                                          |
| CTA secundário        | NÃO OBRIGADO                                                                      |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 14,
  step_name: "additional-coverage-vaccine",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Adicionar" ou "Não Obrigado"
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "additional-coverage-vaccine",
  step_number: 14,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

Não se aplica — o usuário é obrigado a escolher entre uma das duas opções para avançar.

---

## Lógica de Navegação

| Direção                | Destino                                                                      | Condição                   |
| ---------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| Próximo (Adicionar)    | [Step 15 — Additional Coverage Checkup](./15-additional-coverage-checkup.md) | Usuário aceita a cobertura |
| Próximo (Não Obrigado) | [Step 15 — Additional Coverage Checkup](./15-additional-coverage-checkup.md) | Usuário recusa a cobertura |
| Voltar                 | [Step 13 — Coverage](./13-coverage.md)                                       | —                          |

---

## Regras de Negócio

- A cobertura de vacinas é opcional — o usuário pode recusar sem impacto na contratação do plano base.
- O valor adicional exibido é **+R$20,00/mês** — confirmar se é fixo ou varia conforme plano/espécie/região.
- Ambas as ações ("Adicionar" e "Não Obrigado") avançam para o próximo step.
- Confirmar se a escolha é registrada no payload enviado ao backend.

---

## Edge Cases

- Verificar se o valor "+R$20,00/mês" é dinâmico e pode variar conforme o plano selecionado no Step 13.
- Confirmar se há diferença de cobertura de vacinas entre cães e gatos.

---

## Notas

- O dataLayer confirma `oldUrl: /onboarding/pet-breed` e `newUrl: /onboarding/coverage`, seguindo o padrão de registro de navegação entre steps.
- O valor do adicional de vacinas deve ser somado ao `value` dos eventos de ecommerce nos steps seguintes caso o usuário aceite.
