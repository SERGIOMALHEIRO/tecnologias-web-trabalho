// ===================================================================
// Gestão de conta: login, registo e perfil — agora via API Express.
// (Etapa 2: substitui o localStorage por chamadas fetch à API REST.)
// ===================================================================

// Constantes de ligação ao servidor Express (guião 5).
const API_BASE_URL = 'http://localhost:3000/api'; // URL base da API
const AUTH_TOKEN_KEY = 'authToken';               // Chave do token JWT no localStorage
const AUTH_USER_KEY = 'authUser';                 // Cache local do utilizador autenticado

// ===================================================================
// Validações específicas portuguesas (mantidas do lado do cliente)
// ===================================================================

function validarTelemovelPortugues(numero) {
    let limpo = numero.replace(/[\s-]/g, "");
    limpo = limpo.replace(/^(\+351|00351)/, "");
    return /^9[1236]\d{7}$/.test(limpo);
}

function validarNifPortugues(nif) {
    if (!/^\d{9}$/.test(nif)) return false;
    const primeiros = ["1", "2", "3", "5", "6", "7", "8", "9"];
    if (!primeiros.includes(nif[0])) return false;
    let soma = 0;
    for (let i = 0; i < 8; i++) soma += Number(nif[i]) * (9 - i);
    let resto = soma % 11;
    let digitoControlo = resto < 2 ? 0 : 11 - resto;
    return Number(nif[8]) === digitoControlo;
}

// ===================================================================
// Referências aos ecrãs (views) e helpers de sessão
// ===================================================================

const loginView = document.getElementById("login-view");
const registoView = document.getElementById("registo-view");
const perfilView = document.getElementById("perfil-view");

// Guarda o token + dados do utilizador autenticado (devolvidos pela API).
function guardarSessao(token, utilizador) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(utilizador));
}

// Devolve o utilizador autenticado em cache (ou null).
function utilizadorAutenticado() {
    const dados = localStorage.getItem(AUTH_USER_KEY);
    return dados ? JSON.parse(dados) : null;
}

function tokenAtual() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

function limparSessao() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}

// ===================================================================
// Controlo de qual ecrã está visível
// ===================================================================

function mostrar(view) {
    loginView.classList.add("escondido");
    registoView.classList.add("escondido");
    perfilView.classList.add("escondido");
    view.classList.remove("escondido");
}

// Decide o ecrã inicial: perfil se já houver sessão (token), senão login.
function ecraInicial() {
    const utilizador = utilizadorAutenticado();
    if (tokenAtual() && utilizador) {
        preencherPerfil(utilizador);
        mostrar(perfilView);
    } else {
        mostrar(loginView);
    }
}

// ===================================================================
// Perfil
// ===================================================================

function preencherPerfil(utilizador) {
    document.getElementById("perfil-saudacao").textContent = "Olá " + (utilizador.nome || "");
    document.getElementById("perfil-nome").textContent = utilizador.nome || "";
    document.getElementById("perfil-email").textContent = utilizador.email || "";
    document.getElementById("perfil-telemovel").textContent = utilizador.telemovel || "";
    document.getElementById("perfil-username").textContent = utilizador.username || "";
    document.getElementById("perfil-nif").textContent = utilizador.nif || "";
    document.getElementById("perfil-morada").textContent = utilizador.morada || "";

    const foto = document.getElementById("perfil-foto");
    if (utilizador.fotografia) {
        foto.src = utilizador.fotografia;
        foto.style.display = "block";
    } else {
        foto.style.display = "none";
    }
}

// ===================================================================
// Login -> POST /api/auth/login (recebe token JWT)
// ===================================================================

document.getElementById("login-form").addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const erro = document.getElementById("login-erro");
    erro.textContent = "";

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
        erro.textContent = "Preencha o username e a password.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // O servidor espera 'identifier' (username OU email) e 'password'.
            body: JSON.stringify({ identifier: username, password: password }),
        });
        const data = await response.json();

        if (response.ok) {
            // Guarda o token e os dados do utilizador devolvidos pela API.
            guardarSessao(data.token, data.user);
            preencherPerfil(data.user);
            mostrar(perfilView);
        } else {
            erro.textContent = data.message || "Username ou password incorretos.";
        }
    } catch (e) {
        console.error('Erro de rede durante o login:', e);
        erro.textContent = "Falha de comunicação com o servidor.";
    }
});

// ===================================================================
// Registo -> POST /api/auth/register
// ===================================================================

document.getElementById("registo-form").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const erro = document.getElementById("registo-erro");
    erro.textContent = "";

    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    const nome = document.getElementById("reg-nome").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const telemovel = document.getElementById("reg-telemovel").value.trim();
    const nif = document.getElementById("reg-nif").value.trim();
    const morada = document.getElementById("reg-morada").value.trim();
    const ficheiroFoto = document.getElementById("reg-foto").files[0];

    // --- Validações do lado do cliente ---
    // (A verificação de unicidade do username/email é feita pelo SERVIDOR.)
    if (!username || !password || !nome || !email || !telemovel || !nif || !morada) {
        erro.textContent = "Preencha todos os campos obrigatórios.";
        return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        erro.textContent = "Email inválido.";
        return;
    }
    if (!validarNifPortugues(nif)) {
        erro.textContent = "NIF português inválido.";
        return;
    }
    if (!validarTelemovelPortugues(telemovel)) {
        erro.textContent = "Número de telemóvel português inválido.";
        return;
    }

    // A foto é opcional; se existir, lê-se como dataURL (base64, assíncrono).
    if (ficheiroFoto) {
        const leitor = new FileReader();
        leitor.onload = function () {
            enviarRegisto({ username, password, nome, email, telemovel, nif, morada, fotografia: leitor.result });
        };
        leitor.readAsDataURL(ficheiroFoto);
    } else {
        enviarRegisto({ username, password, nome, email, telemovel, nif, morada, fotografia: "" });
    }
});

// Envia o pedido POST de registo para o servidor Express.
async function enviarRegisto(novoUserPayload) {
    const erro = document.getElementById("registo-erro");
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // OBRIGATÓRIO: corpo é JSON
            body: JSON.stringify(novoUserPayload),
        });
        const data = await response.json();

        if (response.ok) {
            alert(`Registo de ${novoUserPayload.username} BEM-SUCEDIDO! Pode agora fazer Login.`);
            document.getElementById("registo-form").reset();
            // Volta ao ecrã de login (NÃO faz login automático: a password está cifrada no servidor).
            document.getElementById("login-form").reset();
            document.getElementById("login-erro").textContent = "";
            mostrar(loginView);
        } else {
            erro.textContent = data.message || "Ocorreu um erro no servidor.";
        }
    } catch (e) {
        console.error('Erro de rede durante o registo:', e);
        erro.textContent = "Falha de comunicação com o servidor.";
    }
}

// ===================================================================
// Logout e troca de ecrãs
// ===================================================================

document.getElementById("logout").addEventListener("click", function () {
    limparSessao();
    document.getElementById("login-form").reset();
    document.getElementById("login-erro").textContent = "";
    mostrar(loginView);
});

document.getElementById("ir-registo").addEventListener("click", function () {
    document.getElementById("registo-form").reset();
    document.getElementById("registo-erro").textContent = "";
    mostrar(registoView);
});

document.getElementById("ir-login").addEventListener("click", function () {
    document.getElementById("login-form").reset();
    document.getElementById("login-erro").textContent = "";
    mostrar(loginView);
});

// ===================================================================
// Edição do perfil -> PUT /api/users/:id (usa o token JWT)
// ===================================================================

const editarForm = document.getElementById("editar-form");
const dadosPerfil = document.querySelector(".perfil-dados");
const botaoEditar = document.getElementById("editar-perfil");

let removerFoto = false;

document.getElementById("editar-perfil").addEventListener("click", function () {
    const utilizador = utilizadorAutenticado();
    if (!utilizador) return;
    document.getElementById("edit-nome").value = utilizador.nome || "";
    document.getElementById("edit-email").value = utilizador.email || "";
    document.getElementById("edit-telemovel").value = utilizador.telemovel || "";
    document.getElementById("edit-nif").value = utilizador.nif || "";
    document.getElementById("edit-morada").value = utilizador.morada || "";
    document.getElementById("edit-password").value = ""; // começa vazio (manter a atual)
    document.getElementById("editar-erro").textContent = "";
    document.getElementById("perfil-sucesso").classList.add("escondido");

    removerFoto = false;
    document.getElementById("edit-foto").value = "";
    document.getElementById("foto-info").classList.add("escondido");

    dadosPerfil.classList.add("escondido");
    botaoEditar.classList.add("escondido");
    editarForm.classList.remove("escondido");
});

document.getElementById("limpar-foto").addEventListener("click", function () {
    removerFoto = true;
    document.getElementById("edit-foto").value = "";
    document.getElementById("foto-info").classList.remove("escondido");
});

document.getElementById("edit-foto").addEventListener("change", function () {
    if (this.files[0]) {
        removerFoto = false;
        document.getElementById("foto-info").classList.add("escondido");
    }
});

document.getElementById("cancelar-edicao").addEventListener("click", function () {
    editarForm.classList.add("escondido");
    dadosPerfil.classList.remove("escondido");
    botaoEditar.classList.remove("escondido");
});

document.getElementById("editar-form").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const erro = document.getElementById("editar-erro");
    erro.textContent = "";

    const nome = document.getElementById("edit-nome").value.trim();
    const email = document.getElementById("edit-email").value.trim();
    const telemovel = document.getElementById("edit-telemovel").value.trim();
    const nif = document.getElementById("edit-nif").value.trim();
    const morada = document.getElementById("edit-morada").value.trim();
    const password = document.getElementById("edit-password").value; // opcional
    const ficheiroFoto = document.getElementById("edit-foto").files[0];

    if (!nome || !email || !telemovel || !nif || !morada) {
        erro.textContent = "Preencha todos os campos.";
        return;
    }
    // Password só é validada se o utilizador escreveu uma nova.
    if (password && password.length < 4) {
        erro.textContent = "A nova password deve ter pelo menos 4 caracteres.";
        return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        erro.textContent = "Email inválido.";
        return;
    }
    if (!validarNifPortugues(nif)) {
        erro.textContent = "NIF português inválido.";
        return;
    }
    if (!validarTelemovelPortugues(telemovel)) {
        erro.textContent = "Número de telemóvel português inválido.";
        return;
    }

    const updates = { nome, email, telemovel, nif, morada };
    if (password) updates.password = password; // só envia se foi preenchida (a API encripta)

    if (ficheiroFoto) {
        const leitor = new FileReader();
        leitor.onload = function () {
            updates.fotografia = leitor.result;
            enviarAtualizacao(updates);
        };
        leitor.readAsDataURL(ficheiroFoto);
    } else {
        if (removerFoto) updates.fotografia = "";
        enviarAtualizacao(updates);
    }
});

// Envia o PUT de atualização do perfil (rota protegida -> precisa do token).
async function enviarAtualizacao(updates) {
    const erro = document.getElementById("editar-erro");
    const utilizador = utilizadorAutenticado();
    if (!utilizador) return;

    try {
        const response = await fetch(`${API_BASE_URL}/users/${utilizador.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenAtual()}` // Envia o token JWT
            },
            body: JSON.stringify(updates),
        });
        const data = await response.json();

        if (response.ok) {
            // Atualiza a cache local com o utilizador devolvido pela API.
            const atualizado = { ...utilizador, ...data.user, id: utilizador.id };
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(atualizado));
            preencherPerfil(atualizado);

            editarForm.classList.add("escondido");
            dadosPerfil.classList.remove("escondido");
            botaoEditar.classList.remove("escondido");

            const sucesso = document.getElementById("perfil-sucesso");
            sucesso.classList.remove("escondido");
            setTimeout(function () { sucesso.classList.add("escondido"); }, 3000);
        } else {
            erro.textContent = data.message || "Erro ao guardar as alterações.";
        }
    } catch (e) {
        console.error('Erro de rede ao atualizar o perfil:', e);
        erro.textContent = "Falha de comunicação com o servidor.";
    }
}

// ===================================================================
// Botão de submit desativado enquanto há campos por preencher
// ===================================================================

function ligarBotaoAosCampos(idFormulario, idsCampos) {
    const form = document.getElementById(idFormulario);
    const botao = form.querySelector("button[type=submit]");
    const campos = idsCampos.map(function (id) { return document.getElementById(id); });

    function atualizar() {
        const todosPreenchidos = campos.every(function (campo) {
            return campo.value.trim() !== "";
        });
        botao.disabled = !todosPreenchidos;
    }
    campos.forEach(function (campo) { campo.addEventListener("input", atualizar); });
    atualizar();
}

ligarBotaoAosCampos("login-form", ["login-username", "login-password"]);
ligarBotaoAosCampos("registo-form", ["reg-username", "reg-password", "reg-nome", "reg-email", "reg-telemovel", "reg-nif", "reg-morada"]);

// Arranca no ecrã correto.
ecraInicial();
