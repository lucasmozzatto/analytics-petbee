# Step 16 — Additional Coverage Dental (Cobertura Adicional Dental)

**Step number:** 16
**Route name:** `additional-coverage-dental`
**URL:** `/onboarding/additional-coverage-dental`

---

## Visão Geral

O usuário decide se deseja adicionar a cobertura de limpeza dentária ao plano. É o último dos três steps de coberturas adicionais (14, 15, 16). O subtítulo reforça que a escolha pode ser alterada antes do pagamento.

---

## Screenshot

![Step 16 - Additional Coverage Dental](./screenshots/16-additional-coverage-dental.png)

---

## Campos

| Campo                      | Tipo                            | Obrigatório | Validação                     | Máscara |
| -------------------------- | ------------------------------- | :---------: | ----------------------------- | ------- |
| Adicionar cobertura dental | Botão de ação (aceitar/recusar) |     ✅      | Deve clicar em uma das opções | —       |

---

## Textos da UI

| Elemento              | Texto                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Título                | A maioria dos cães precisa de cuidados nos dentes. Quer garantir essa proteção adicional para a {pet_name}? |
| Subtítulo             | Você pode alterar antes de efetuar o pagamento                                                              |
| Nome do adicional     | Limpeza dentária                                                                                            |
| Cobertura 1           | Limpeza dentária (mão de obra e sedação)                                                                    |
| CTA (botão principal) | Adicionar (+R$60,00/MÊS)                                                                                    |
| CTA secundário        | NÃO OBRIGADO                                                                                                |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 16,
  step_name: "additional-coverage-dental",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Adicionar" ou "Não Obrigado"
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "additional-coverage-dental",
  step_number: 16,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

Não se aplica — o usuário é obrigado a escolher entre uma das duas opções para avançar.

---

## Lógica de Navegação

| Direção                | Destino                                                                      | Condição                   |
| ---------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| Próximo (Adicionar)    | [Step 17 — Register](./17-register.md)                                       | Usuário aceita a cobertura |
| Próximo (Não Obrigado) | [Step 17 — Register](./17-register.md)                                       | Usuário recusa a cobertura |
| Voltar                 | [Step 15 — Additional Coverage Checkup](./15-additional-coverage-checkup.md) | —                          |

---

## Regras de Negócio

- A cobertura dental é opcional — o usuário pode recusar sem impacto na contratação do plano base.
- O valor adicional exibido é **+R$60,00/mês** — confirmar se é fixo ou varia conforme plano/espécie/região.
- Este é o último step de coberturas adicionais — após esta escolha o usuário segue para o cadastro (Step 17).
- O título menciona "cães" explicitamente — confirmar se este step é exibido apenas para tutores de cachorros ou também para gatos.
- Ambas as ações ("Adicionar" e "Não Obrigado") avançam para o próximo step.

---

## Edge Cases

- Confirmar se este step é exibido para tutores de gatos — limpeza dentária pode não se aplicar ou ter cobertura diferente.
- Verificar se o valor "+R$60,00/mês" é dinâmico conforme plano selecionado no Step 13.
- Confirmar onde o usuário pode "alterar antes de efetuar o pagamento" conforme indicado no subtítulo.

---

## Notas

- O dataLayer confirma `oldUrl: /onboarding/additional-coverage-vaccine` e `newUrl: /onboarding/additional-coverage-checkup`, seguindo o padrão de registro de navegação entre steps.
- Após este step, o valor total do plano deve refletir a soma do plano base (Step 13) + adicionais aceitos (Steps 14, 15 e/ou 16).
