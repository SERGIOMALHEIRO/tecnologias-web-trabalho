// ===================================================================
// Gestão de conta: login, registo e perfil com localStorage.
// ===================================================================

// Chaves usadas no localStorage.
const CHAVE_UTILIZADORES = "utilizadores";     
const CHAVE_LOGADO = "utilizadorLogado";         

// ===================================================================
// Validações específicas portuguesas
// ===================================================================

// Valida um número de telemóvel de redes portuguesas.
// Aceita o indicativo opcional +351 / 00351 e espaços.
// Os telemóveis em Portugal têm 9 dígitos e começam por 91, 92, 93 ou 96.
function validarTelemovelPortugues(numero) {
    // Remove espaços, traços e o indicativo internacional, se existir.
    let limpo = numero.replace(/[\s-]/g, "");
    limpo = limpo.replace(/^(\+351|00351)/, "");

    // Tem de ficar com 9 dígitos a começar por 9 e 2º dígito 1, 2, 3 ou 6.
    return /^9[1236]\d{7}$/.test(limpo);
}

// Valida um NIF português (Número de Identificação Fiscal).
// Regras: 9 dígitos, primeiro dígito válido e dígito de controlo (módulo 11).
function validarNifPortugues(nif) {
    // Tem de ter exatamente 9 dígitos.
    if (!/^\d{9}$/.test(nif)) {
        return false;
    }

    // O primeiro dígito identifica o tipo de contribuinte.
    // Válidos: 1, 2, 3 (singulares), 5, 6, 7, 8, 9 (coletivos e outros).
    const primeiros = ["1", "2", "3", "5", "6", "7", "8", "9"];
    if (!primeiros.includes(nif[0])) {
        return false;
    }

    // Cálculo do dígito de controlo (checksum módulo 11).
    let soma = 0;
    for (let i = 0; i < 8; i++) {
        soma += Number(nif[i]) * (9 - i);
    }
    let resto = soma % 11;
    let digitoControlo = resto < 2 ? 0 : 11 - resto;

    // O 9.º dígito tem de coincidir com o dígito de controlo calculado.
    return Number(nif[8]) === digitoControlo;
}

// --- Referências aos ecrãs (views) ---
const loginView = document.getElementById("login-view");
const registoView = document.getElementById("registo-view");
const perfilView = document.getElementById("perfil-view");

// ===================================================================
// Funções auxiliares de localStorage
// ===================================================================

// Devolve a lista de utilizadores registados (array).
function obterUtilizadores() {
    const dados = localStorage.getItem(CHAVE_UTILIZADORES);
    return dados ? JSON.parse(dados) : [];
}

// Grava a lista de utilizadores registados.
function guardarUtilizadores(lista) {
    localStorage.setItem(CHAVE_UTILIZADORES, JSON.stringify(lista));
}

// Procura um utilizador pelo username.
function encontrarUtilizador(username) {
    return obterUtilizadores().find(function (u) {
        return u.username === username;
    });
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

// Decide o ecrã inicial: perfil se já houver sessão, senão login.
function ecraInicial() {
    const logado = localStorage.getItem(CHAVE_LOGADO);
    if (logado && encontrarUtilizador(logado)) {
        preencherPerfil(encontrarUtilizador(logado));
        mostrar(perfilView);
    } else {
        mostrar(loginView);
    }
}

// ===================================================================
// Perfil
// ===================================================================

function preencherPerfil(utilizador) {
    document.getElementById("perfil-saudacao").textContent = "Olá " + utilizador.nome;
    document.getElementById("perfil-nome").textContent = utilizador.nome;
    document.getElementById("perfil-email").textContent = utilizador.email;
    document.getElementById("perfil-telemovel").textContent = utilizador.telemovel;
    document.getElementById("perfil-username").textContent = utilizador.username;
    document.getElementById("perfil-nif").textContent = utilizador.nif;
    document.getElementById("perfil-morada").textContent = utilizador.morada;

    const foto = document.getElementById("perfil-foto");
    if (utilizador.foto) {
        foto.src = utilizador.foto;
        foto.style.display = "block";
    } else {
        foto.style.display = "none";
    }
}

// ===================================================================
// Login
// ===================================================================

document.getElementById("login-form").addEventListener("submit", function (evento) {
    evento.preventDefault();
    const erro = document.getElementById("login-erro");
    erro.textContent = "";

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
        erro.textContent = "Preencha o username e a password.";
        return;
    }

    const utilizador = encontrarUtilizador(username);
    if (!utilizador || utilizador.password !== password) {
        erro.textContent = "Username ou password incorretos.";
        return;
    }

    // Guarda a sessão e abre o perfil.
    localStorage.setItem(CHAVE_LOGADO, username);
    preencherPerfil(utilizador);
    mostrar(perfilView);
});

// ===================================================================
// Registo
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

    // --- Validações ---
    if (!username || !password || !nome || !email || !telemovel || !nif || !morada) {
        erro.textContent = "Preencha todos os campos obrigatórios.";
        return;
    }
    if (encontrarUtilizador(username)) {
        erro.textContent = "Já existe um utilizador com esse username.";
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

    // Cria o objeto utilizador.
    const novoUtilizador = {
        username: username,
        password: password,
        nome: nome,
        email: email,
        telemovel: telemovel,
        nif: nif,
        morada: morada,
        foto: ""
    };

    // A foto é opcional; se existir, lê-se como dataURL (base64) e só
    // depois se grava (a leitura do ficheiro é assíncrona).
    if (ficheiroFoto) {
        const leitor = new FileReader();
        leitor.onload = function () {
            novoUtilizador.foto = leitor.result;
            concluirRegisto(novoUtilizador);
        };
        leitor.readAsDataURL(ficheiroFoto);
    } else {
        concluirRegisto(novoUtilizador);
    }
});

function concluirRegisto(novoUtilizador) {
    const lista = obterUtilizadores();
    lista.push(novoUtilizador);
    guardarUtilizadores(lista);

    // Inicia sessão automaticamente e abre o perfil.
    localStorage.setItem(CHAVE_LOGADO, novoUtilizador.username);
    preencherPerfil(novoUtilizador);
    mostrar(perfilView);

    document.getElementById("registo-form").reset();
}

// ===================================================================
// Logout e troca de ecrãs
// ===================================================================

document.getElementById("logout").addEventListener("click", function () {
    localStorage.removeItem(CHAVE_LOGADO);
    document.getElementById("login-form").reset();
    document.getElementById("login-erro").textContent = "";
    mostrar(loginView);
});

document.getElementById("ir-registo").addEventListener("click", function () {
    document.getElementById("registo-erro").textContent = "";
    mostrar(registoView);
});

document.getElementById("ir-login").addEventListener("click", function () {
    document.getElementById("login-erro").textContent = "";
    mostrar(loginView);
});

// Arranque.
ecraInicial();
