# Step 7 — Pet Family (Espécie do Pet)

**Step number:** 7
**Route name:** `pet-family`
**URL:** `/onboarding/pet-family`

---

## Visão Geral

O usuário seleciona a espécie do pet (cachorro ou gato). A escolha é feita por meio de cards visuais com imagem representativa de cada espécie. O título é personalizado com o nome do pet coletado no Step 6.

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo          | Tipo                  | Obrigatório | Validação                      | Máscara |
| -------------- | --------------------- | :---------: | ------------------------------ | ------- |
| Espécie do pet | Seleção visual (card) |     ✅      | Deve selecionar uma das opções | —       |

---

## Textos da UI

| Elemento              | Texto                                         |
| --------------------- | --------------------------------------------- |
| Título                | Maravilha! {pet_name}, me conta o que você é? |
| Subtítulo             | —                                             |
| Opção 1               | Cachorro (com imagem de dog)                  |
| Opção 2               | Gato (com imagem de cat)                      |
| CTA (botão principal) | Continuar                                     |
| CTA secundário        | —                                             |
| Mensagem de erro      | TODO                                          |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 7,
  step_name: "pet-family",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Continuar" após selecionar a espécie
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "pet-family",
  step_number: 7,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: usuário tenta avançar sem selecionar uma espécie
window.dataLayer.push({
  event: "form_error",
  step_number: 7,
  step_name: "pet-family",
  error_field: "pet_family",
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                               | Condição            |
| ------- | ------------------------------------- | ------------------- |
| Próximo | [Step 8 — Address](./08-address.md)   | Espécie selecionada |
| Voltar  | [Step 6 — Pet Name](./06-pet-name.md) | —                   |

---

## Regras de Negócio

- O título usa `{pet_name}` coletado no Step 6 para personalização.
- Apenas duas opções disponíveis: **cachorro** e **gato**.
- A espécie selecionada aqui provavelmente influencia opções exibidas nos steps seguintes (ex: raças no Step 10 — `pet-breed`).

---

## Edge Cases

- Verificar comportamento caso `{pet_name}` não esteja disponível (ex: acesso direto à URL).
- Confirmar se o botão "Continuar" fica desabilitado até uma opção ser selecionada, ou se exibe erro apenas ao tentar avançar sem seleção.

---

## Notas

- A seleção da espécie é um dado estrutural do funil — impacta raças disponíveis, coberturas e possivelmente precificação.
- O dataLayer confirma `oldUrl: /onboarding/customer` e `newUrl: /onboarding/pet-name`, seguindo o padrão de registro de navegação entre steps.
