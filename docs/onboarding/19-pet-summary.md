# Step 19 — Pet Summary (Resumo do Pet)

**Step number:** 19
**Route name:** `pet-summary`
**URL:** `/onboarding/pet-summary`

---

## Visão Geral

Exibe um resumo das informações do pet cadastrado durante o onboarding para revisão do usuário antes de prosseguir. O usuário pode confirmar os dados ou adicionar mais pets ao plano. O botão "Continuar" fica desabilitado até a ação ser completada.

---

## Screenshot

![Step 19 - Pet Summary](./screenshots/19-pet-summary.png)

---

## Campos

| Campo | Tipo                     | Obrigatório | Validação | Máscara |
| ----- | ------------------------ | :---------: | --------- | ------- |
| —     | Somente leitura (resumo) |      —      | —         | —       |

---

## Textos da UI

| Elemento              | Texto                                                   |
| --------------------- | ------------------------------------------------------- |
| Título                | Uhul! Aqui está um resumo das informações da {pet_name} |
| Label Nome            | Nome                                                    |
| Label Gênero          | Gênero                                                  |
| Label Idade           | Idade                                                   |
| Label Raça            | Raça                                                    |
| CTA adicionar pet     | ADICIONAR MAIS PETS                                     |
| CTA (botão principal) | Continuar                                               |

---

## Dados exibidos no resumo

| Campo  | Exemplo |
| ------ | ------- |
| Nome   | teste   |
| Gênero | Menina  |
| Idade  | 5 meses |
| Raça   | Aidi    |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 19,
  step_name: "pet-summary",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Continuar"
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "pet-summary",
  step_number: 19,
  direction: "forward",
  method: "email",
});
```

### Eventos de Erro (se aplicável)

Não se aplica — step de revisão sem campos editáveis.

---

## Lógica de Navegação

| Direção       | Destino                              | Condição                               |
| ------------- | ------------------------------------ | -------------------------------------- |
| Próximo       | [Step 20 — Summary](./20-summary.md) | Usuário clica em "Continuar"           |
| Adicionar pet | Retorna ao Step 6 — Pet Name         | Usuário clica em "Adicionar mais pets" |
| Voltar        | [Step 18 — Confirm](./18-confirm.md) | —                                      |

---

## Regras de Negócio

- Este step exibe os dados consolidados do pet coletados nos Steps 6, 7, 9 e 10.
- O usuário pode adicionar mais pets clicando em "ADICIONAR MAIS PETS" — o fluxo retorna ao Step 6 para cadastro de um novo pet.
- O botão "Continuar" aparece desabilitado (`Mui-disabled`) — confirmar condição exata de habilitação.
- Cada pet adicional passa pelo mesmo subfluxo (Steps 6 → 10) antes de retornar ao pet-summary.

---

## Edge Cases

- Confirmar comportamento ao adicionar múltiplos pets: o resumo exibe todos os pets cadastrados ou um por vez.
- Verificar se é possível editar os dados do pet a partir deste step ou se requer navegação manual de volta.
- Confirmar limite máximo de pets que podem ser adicionados ao plano.

---

## Notas

- O dataLayer mostra `historyChangeSource: 'replaceState'` (ao invés do `pushState` dos steps anteriores) e `oldUrl === newUrl: /onboarding/confirm` — indica que a transição para este step ocorre sem mudança de URL registrada no histórico do browser.
- O `method: 'email'` no dataLayer é herdado do Step 18 — confirmar se é intencional ou resíduo do evento anterior.
