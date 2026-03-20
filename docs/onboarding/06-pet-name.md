# Step 6 — Pet Name (Nome do Pet)

**Step number:** 6
**Route name:** `pet-name`
**URL:** `/onboarding/pet-name`

---

## Visão Geral

O usuário informa o nome do seu pet. O título é personalizado com o nome do cliente coletado no Step 5. O subtítulo já antecipa que será possível incluir mais pets posteriormente.

---

## Screenshot

<!-- Adicionar screenshot ou link para Figma -->

TODO

---

## Campos

| Campo       | Tipo       | Obrigatório | Validação          | Máscara |
| ----------- | ---------- | :---------: | ------------------ | ------- |
| Nome do pet | Text input |     ✅      | Não pode ser vazio | —       |

---

## Textos da UI

| Elemento              | Texto                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| Título                | Hey {name}, mal posso esperar para conhecer o seu pet. Como ele se chama?     |
| Subtítulo             | Não se preocupe que, caso tenha mais de um pet, logo poderá incluí-los também |
| CTA (botão principal) | Continuar                                                                     |
| CTA secundário        | —                                                                             |
| Placeholder(s)        | TODO                                                                          |
| Mensagem de erro      | TODO                                                                          |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 6,
  step_name: "pet-name",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Continuar"
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "pet-name",
  step_number: 6,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: TODO (ex: campo nome do pet vazio)
window.dataLayer.push({
  event: "form_error",
  step_number: 6,
  step_name: "pet-name",
  error_field: "TODO",
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                                   | Condição                     |
| ------- | ----------------------------------------- | ---------------------------- |
| Próximo | [Step 7 — Pet Family](./07-pet-family.md) | Campo nome do pet preenchido |
| Voltar  | [Step 5 — Customer](./05-customer.md)     | —                            |

---

## Regras de Negócio

- O título usa o `{name}` coletado no Step 5 para personalização.
- O subtítulo comunica que múltiplos pets poderão ser adicionados — o fluxo atual coleta dados de um pet por vez.
- O evento `onboarding_step` segue o mesmo padrão dos demais steps, com `direction: 'forward'` ao avançar.

---

## Edge Cases

- Verificar comportamento caso o `{name}` do Step 5 não esteja disponível (ex: acesso direto à URL).
- Verificar se aceita caracteres especiais, emojis e nomes compostos para o pet.

---

## Notas

- O dataLayer confirma que ao avançar do Step 6, a `newUrl` é `/onboarding/customer` → indica que o evento é disparado **na saída** do step anterior, registrando a chegada ao step atual.
- UTM params são preservados na `oldUrl`, o que confirma que a sessão de tracking mantém os parâmetros de origem do lead.
