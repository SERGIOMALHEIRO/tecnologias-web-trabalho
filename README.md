# Tecnologias de Aplicações Web (TAW)
## Projeto de Módulo — Etapa 1 — Grupo 2

Aplicação web (HTML + CSS + JavaScript) com página institucional, autenticação
de utilizadores (registo, login e perfil) e painel de administração, usando
`localStorage` para persistência dos dados.

## Elementos do Grupo
Carlos Covas
Rafael Moreira 
Sérgio Malheiro 

## Estrutura do projeto

```
trabalho/
├── index.html          # Página inicial (estrutura + layout responsivo)
├── conta.html          # Login / Registo / Perfil
├── admin.html          # Painel de administração
├── css/
│   └── style.css       # Estilos de todas as páginas
├── js/
│   ├── conta.js        # Lógica de autenticação e perfil
│   └── admin.js        # Lógica do painel de administração
├── img/
│   ├── logo_html.png
│   ├── logo_css.png
│   └── logo_js.png
└── README.md
```

---

## Funcionalidades implementadas

### 1. Estrutura e Layout (Aulas 1 e 2)
- HTML semântico e CSS para o `index.html`.
- Layout responsivo (CSS Grid + media query para ecrãs ≥ 768px).
- Organização do código em pastas (`css/`, `js/`, `img/`).

### 2. Autenticação (Aulas 3 e 4)
- **Registo** de novo utilizador: username, password, nome, email, fotografia,
  telemóvel, NIF e morada.
- **Login** com verificação de credenciais.
- **Perfil** do utilizador com sessão iniciada (mostra os dados do registo).
- **Alternância** entre Formulário (Login/Registo) e Área de Perfil.
- **Sessão e persistência** em `localStorage` (array de utilizadores registados
  + utilizador com sessão ativa).
- **Validação e tratamento de erros** com mensagens específicas.

### 3. Gestão de Utilizadores (Aula 4)
- Painel de administração que **lista os utilizadores registados**.
- A tabela é **construída dinamicamente** por JavaScript (`createElement`).
- **Remoção** de utilizadores: individual (botão por linha) e em massa
  (checkboxes + "Remover Selecionados").

### Funcionalidades extra (bonificação)
- **Validação de telemóvel português** (prefixos 91/92/93/96, aceita +351).
- **Validação de NIF português** com dígito de controlo (módulo 11).
- **Edição do perfil** (alterar dados e foto e guardar em `localStorage`).
- **Botão de submit desativado** enquanto há campos obrigatórios por preencher.

---

## Como executar

Abrir o `index.html` num browser (ou usar a extensão *Live Server* no VS Code).
Não requer servidor nem instalação de dependências.
