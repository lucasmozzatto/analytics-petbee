# Step 8 — Address (Endereço)

**Step number:** 8
**Route name:** `address`
**URL:** `/onboarding/address`

---

## Visão Geral

O usuário informa o endereço residencial. O preenchimento começa pelo CEP, que aciona uma busca automática e pré-preenche os campos de logradouro, bairro, cidade e estado. O usuário complementa com número e complemento.

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo       | Tipo                         | Obrigatório | Validação                   | Máscara     |
| ----------- | ---------------------------- | :---------: | --------------------------- | ----------- |
| CEP         | Text input                   |     ✅      | CEP válido (8 dígitos)      | `00000-000` |
| Logradouro  | Text input (auto-preenchido) |     ✅      | Preenchido via busca de CEP | —           |
| Número      | Text input                   |     ✅      | Não pode ser vazio          | —           |
| Complemento | Text input                   |     ❌      | —                           | —           |
| Bairro      | Text input (auto-preenchido) |     ✅      | Preenchido via busca de CEP | —           |
| Cidade      | Text input (auto-preenchido) |     ✅      | Preenchido via busca de CEP | —           |
| Estado      | Text input (auto-preenchido) |     ✅      | Preenchido via busca de CEP | —           |

---

## Textos da UI

| Elemento              | Texto                              |
| --------------------- | ---------------------------------- |
| Título                | Onde você e seu pet estão morando? |
| Subtítulo             | —                                  |
| CTA (botão principal) | Continuar                          |
| CTA secundário        | —                                  |
| Placeholder(s)        | TODO                               |
| Mensagem de erro      | TODO                               |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 8,
  step_name: "address",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Continuar" com endereço preenchido
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "address",
  step_number: 8,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: CEP inválido ou campos obrigatórios não preenchidos
window.dataLayer.push({
  event: "form_error",
  step_number: 8,
  step_name: "address",
  error_field: "TODO", // ex: 'cep', 'number'
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                                     | Condição                   |
| ------- | ------------------------------------------- | -------------------------- |
| Próximo | [Step 9 — Pet Details](./09-pet-details.md) | Endereço válido e completo |
| Voltar  | [Step 7 — Pet Family](./07-pet-family.md)   | —                          |

---

## Regras de Negócio

- O CEP aciona uma busca automática de endereço (provavelmente via API ViaCEP ou similar).
- Os campos logradouro, bairro, cidade e estado são pré-preenchidos após a busca e podem ser editáveis.
- Complemento é opcional.
- O endereço pode influenciar disponibilidade de planos por região — confirmar se há validação de cobertura geográfica.

---

## Edge Cases

- CEP não encontrado: exibir mensagem de erro e permitir preenchimento manual.
- CEP de região sem cobertura: verificar se o fluxo bloqueia ou apenas registra.
- Usuário altera campos auto-preenchidos manualmente: confirmar se os dados editados são preservados.

---

## Notas

- O dataLayer confirma `oldUrl: /onboarding/pet-name` e `newUrl: /onboarding/pet-family`, seguindo o padrão de registro de navegação entre steps.
- Endereço é dado sensível — verificar conformidade com LGPD no armazenamento e uso dessas informações.
