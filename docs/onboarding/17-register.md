# Step 17 — Register (Cadastro)

**Step number:** 17
**Route name:** `register`
**URL:** `/onboarding/register`

---

## Visão Geral

O usuário preenche seus dados pessoais para criação de conta: e-mail, telefone e data de nascimento. Também deve aceitar os termos e condições antes de avançar. É o step de registro formal do lead no sistema da Petbee.

---

## Screenshot

![Step 17 - Register](./screenshots/17-register.png)

---

## Campos

| Campo                        | Tipo               | Obrigatório | Validação                       | Máscara           |
| ---------------------------- | ------------------ | :---------: | ------------------------------- | ----------------- |
| E-mail                       | Text input (email) |     ✅      | Formato de e-mail válido        | —                 |
| Telefone                     | Text input (tel)   |     ✅      | Formato de telefone válido      | `(00) 00000-0000` |
| Data de nascimento           | Text input (date)  |     ✅      | Data válida                     | `DD/MM/YYYY`      |
| Aceite de termos e condições | Checkbox           |     ✅      | Deve estar marcado para avançar | —                 |

---

## Textos da UI

| Elemento                       | Texto                                                        |
| ------------------------------ | ------------------------------------------------------------ |
| Título                         | Maravilha! Me conta um pouco sobre você antes de concluirmos |
| Subtítulo                      | —                                                            |
| Placeholder e-mail             | exemplo@gmail.com                                            |
| Placeholder telefone           | (41) 99999-9999                                              |
| Placeholder data de nascimento | DD/MM/YYYY                                                   |
| Label checkbox                 | Eu aceito os termos e condições                              |
| CTA (botão principal)          | Continuar                                                    |
| CTA secundário                 | —                                                            |
| Mensagem de erro               | TODO                                                         |

---

## Eventos / DataLayer

### Pageview

```javascript
window.dataLayer.push({
  event: "onboarding_step_view",
  step_number: 17,
  step_name: "register",
});
```

### Evento(s) de Ação

```javascript
// Disparado quando: usuário clica em "Continuar" com todos os campos válidos
// e termos aceitos
// Tag disparada: 09 | GA4 - onboarding_step (Google Analytics: GA4 Event - Succeeded)
window.dataLayer.push({
  event: "onboarding_step",
  step_name: "register",
  step_number: 17,
  direction: "forward",
});
```

### Eventos de Erro (se aplicável)

```javascript
// Disparado quando: campos inválidos ou termos não aceitos
window.dataLayer.push({
  event: "form_error",
  step_number: 17,
  step_name: "register",
  error_field: "TODO", // ex: 'email', 'phone', 'birthdate', 'terms'
  error_message: "TODO",
});
```

---

## Lógica de Navegação

| Direção | Destino                                                                    | Condição                                 |
| ------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| Próximo | [Step 18 — Confirm](./18-confirm.md)                                       | Todos os campos válidos e termos aceitos |
| Voltar  | [Step 16 — Additional Coverage Dental](./16-additional-coverage-dental.md) | —                                        |

---

## Regras de Negócio

- O aceite dos termos e condições é obrigatório — o botão "Continuar" deve estar bloqueado ou exibir erro caso o checkbox não esteja marcado.
- O e-mail informado aqui será usado como credencial de acesso à conta Petbee.
- Verificar se o e-mail já cadastrado gera erro ou redireciona para login.
- A data de nascimento pode ser usada para validação de idade mínima para contratação — confirmar.
- O DDD do placeholder `(41)` sugere Curitiba como padrão — confirmar se é apenas ilustrativo ou pré-preenchido com base no CEP (Step 8).

---

## Edge Cases

- E-mail já cadastrado: confirmar mensagem de erro e comportamento (bloquear avanço, sugerir login).
- Data de nascimento de menor de idade: confirmar se há bloqueio ou mensagem específica.
- Telefone inválido ou com DDD inexistente: confirmar mensagem de erro.
- Usuário desmarca o checkbox de termos após tê-lo marcado: confirmar se o botão é desabilitado novamente.

---

## Notas

- Este é o step de criação de conta — a partir daqui o lead passa a ser um usuário registrado no sistema.
- O dataLayer confirma `oldUrl: /onboarding/additional-coverage-checkup` e `newUrl: /onboarding/additional-coverage-dental`, seguindo o padrão de registro de navegação entre steps.
- Verificar conformidade com LGPD: o aceite de termos deve registrar timestamp e versão do documento aceito.
- O link "termos e condições" deve abrir em nova aba para não interromper o fluxo de onboarding.
