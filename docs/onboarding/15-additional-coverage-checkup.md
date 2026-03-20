# Step 15 — Additional Coverage Checkup (Cobertura Adicional de Checkup)

**Step number:** 15
**Route name:** `additional-coverage-checkup`
**URL:** `/onboarding/additional-coverage-checkup`

---

## Visão Geral

O usuário decide se deseja adicionar a cobertura preventiva de checkup anual ao plano. O step apresenta as coberturas incluídas e o valor adicional mensal, com opção de aceitar ou recusar. O subtítulo reforça que a escolha pode ser alterada antes do pagamento.

---

## Screenshot

![Step 15 - Additional Coverage Checkup](./screenshots/15-additional-coverage-checkup.png)

---

## Campos

| Campo                          | Tipo                            | Obrigatório | Validação                     | Máscara |
| ------------------------------ | ------------------------------- | :---------: | ----------------------------- | ------- |
| Adicionar cobertura de checkup | Botão de ação (aceitar/recusar) |     ✅      | Deve clicar em uma das opções | —       |

---

## Textos da UI

| Elemento              | Texto                                                                |
| --------------------- | -------------------------------------------------------------------- |
| Título                | Mantenha a {pet_name} sempre saudável com nossa cobertura preventiva |
| Subtítulo             | Você pode alterar antes de efetuar o pagamento                       |
| Nome do adicional     | Checkup Anual                                                        |
| Cobertura 1           | 1 consulta de rotina                                                 |
| Cobertura 2           | 1 exame de sangue anual                                              |
| CTA (botão principal) | Adicionar (+R$30,00/MÊS)                                             |
| CTA secundário        | NÃO OBRIGADO                                                         |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 15,
  step_name: "additional-coverage-checkup",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Adicionar" ou "Não Obrigado"
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "additional-coverage-checkup",
  step_number: 15,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

Não se aplica — o usuário é obrigado a escolher entre uma das duas opções para avançar.

---

## Lógica de Navegação

| Direção                | Destino                                                                      | Condição                   |
| ---------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| Próximo (Adicionar)    | [Step 16 — Additional Coverage Dental](./16-additional-coverage-dental.md)   | Usuário aceita a cobertura |
| Próximo (Não Obrigado) | [Step 16 — Additional Coverage Dental](./16-additional-coverage-dental.md)   | Usuário recusa a cobertura |
| Voltar                 | [Step 14 — Additional Coverage Vaccine](./14-additional-coverage-vaccine.md) | —                          |

---

## Regras de Negócio

- A cobertura de checkup é opcional — o usuário pode recusar sem impacto na contratação do plano base.
- O valor adicional exibido é **+R$30,00/mês** — confirmar se é fixo ou varia conforme plano/espécie/região.
- O subtítulo comunica que a escolha pode ser revista antes do pagamento — confirmar em qual step isso é possível.
- Ambas as ações ("Adicionar" e "Não Obrigado") avançam para o próximo step.

---

## Edge Cases

- Verificar se o valor "+R$30,00/mês" é dinâmico conforme o plano selecionado no Step 13.
- Confirmar se há diferença de cobertura de checkup entre cães e gatos.
- Verificar onde exatamente o usuário pode "alterar antes de efetuar o pagamento" conforme indicado no subtítulo.

---

## Notas

- O dataLayer confirma `oldUrl: /onboarding/coverage` e `newUrl: /onboarding/additional-coverage-vaccine`, seguindo o padrão de registro de navegação entre steps.
- O valor do adicional de checkup deve ser somado ao `value` dos eventos de ecommerce nos steps seguintes caso o usuário aceite.
- O título na screenshot não contém `{pet_name}` — confirmar se é personalizado ou texto fixo.
