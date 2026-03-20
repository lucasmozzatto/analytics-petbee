# Step 4 — Continue (Retomada de Sessão)

**Step number:** 4
**Route name:** `continue`
**URL:** `/onboarding/continue`

---

## Visão Geral

Step de transição após o login bem-sucedido. O usuário autenticado é encaminhado para iniciar o processo de contratação de um novo plano para um pet adicional, redirecionando para o Step 6 (`pet-name`) onde começa o fluxo normal de cadastro do pet.

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo | Tipo | Obrigatório | Validação | Máscara |
| ----- | ---- | :---------: | --------- | ------- |
| —     | —    |      —      | —         | —       |

---

## Textos da UI

| Elemento              | Texto |
| --------------------- | ----- |
| Título                | TODO  |
| Subtítulo             | TODO  |
| CTA (botão principal) | TODO  |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 4,
  step_name: "continue",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em continuar
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "continue",
  step_number: 4,
  direction: "forward",
});
```

---

## Lógica de Navegação

| Direção | Destino                               | Condição                                             |
| ------- | ------------------------------------- | ---------------------------------------------------- |
| Próximo | [Step 6 — Pet Name](./06-pet-name.md) | Usuário autenticado — inicia contratação de novo pet |
| Voltar  | [Step 3 — Verify](./03-verify.md)     | —                                                    |

---

## Regras de Negócio

- Acessado apenas por usuários que completaram o login via Steps 2 e 3.
- O usuário já está autenticado neste ponto — os dados pessoais (nome, endereço, etc.) são recuperados da conta existente.
- O fluxo pula os steps de dados pessoais (5 — `customer`, 8 — `address`, 17 — `register`, 18 — `confirm`) pois o usuário já possui cadastro.
- A partir do Step 6, o fluxo é idêntico ao de novos usuários.

---

## Edge Cases

- Confirmar quais steps são pulados para usuários já cadastrados (ex: endereço, dados pessoais, registro).
- Verificar se os dados da conta existente são pré-preenchidos nos steps seguintes ou apenas omitidos.

---

## Notas

- Este step é essencialmente uma tela de boas-vindas/confirmação de identidade antes de iniciar o cadastro do novo pet.
- TODO — confirmar se exibe nome do usuário logado ou resumo da conta.
- TODO — confirmar se dispara algum evento de `login` no dataLayer.
