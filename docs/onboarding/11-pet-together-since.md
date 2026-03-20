# Step 11 — Pet Together Since (Tempo Juntos)

**Step number:** 11
**Route name:** `pet-together-since`
**URL:** `/onboarding/pet-together-since`

---

## Visão Geral

> ℹ️ **Step incorporado.** Esta etapa não possui tela ou evento de tracking próprio. O campo "há quanto tempo estão juntos" é coletado dentro do **Step 9 — Pet Details** (`/onboarding/pet-details`).

---

## Campos

| Campo        | Tipo   | Obrigatório | Validação          | Máscara |
| ------------ | ------ | :---------: | ------------------ | ------- |
| Tempo juntos | Select |     ✅      | Coletado no Step 9 | —       |

---

## Eventos / DataLayer

Nenhum evento próprio disparado — coleta ocorre dentro do Step 9.

---

## Lógica de Navegação

| Direção | Destino | Condição              |
| ------- | ------- | --------------------- |
| —       | —       | Incorporado ao Step 9 |

---

## Notas

- A route `pet-together-since` existe no mapa de steps mas não é acessada de forma independente no fluxo atual.
- Ver documentação completa em [Step 9 — Pet Details](./09-pet-details.md).
