// ===================================================================
// Painel de Administração: listar e remover utilizadores registados.
// A tabela é construída dinamicamente a partir do localStorage.
// ===================================================================

const CHAVE_UTILIZADORES = "utilizadores";   // lista de registados
const CHAVE_LOGADO = "utilizadorLogado";      // username com sessão iniciada

// --- Funções auxiliares de localStorage ---

function obterUtilizadores() {
    const dados = localStorage.getItem(CHAVE_UTILIZADORES);
    return dados ? JSON.parse(dados) : [];
}

function guardarUtilizadores(lista) {
    localStorage.setItem(CHAVE_UTILIZADORES, JSON.stringify(lista));
}

// ===================================================================
// Controlo de acesso
// ===================================================================

// Só um utilizador com sessão iniciada pode ver o painel.
// Caso contrário é reencaminhado para a página de conta (login).
function verificarAcesso() {
    if (!localStorage.getItem(CHAVE_LOGADO)) {
        window.location.href = "conta.html";
    }
}

// ===================================================================
// Construção dinâmica da tabela
// ===================================================================

function desenharTabela() {
    const corpo = document.getElementById("corpo-utilizadores");
    const semUtilizadores = document.getElementById("sem-utilizadores");
    const tabela = document.getElementById("tabela-utilizadores");

    // Limpa o conteúdo anterior.
    corpo.innerHTML = "";

    const utilizadores = obterUtilizadores();

    // Se não houver registos, mostra mensagem e esconde a tabela.
    if (utilizadores.length === 0) {
        tabela.classList.add("escondido");
        semUtilizadores.classList.remove("escondido");
        return;
    }
    tabela.classList.remove("escondido");
    semUtilizadores.classList.add("escondido");

    // Cria uma linha por cada utilizador.
    utilizadores.forEach(function (utilizador) {
        const linha = document.createElement("tr");

        // Célula da checkbox de seleção.
        const tdCheck = document.createElement("td");
        const check = document.createElement("input");
        check.type = "checkbox";
        check.className = "selecionar-utilizador";
        check.value = utilizador.username;
        tdCheck.appendChild(check);
        linha.appendChild(tdCheck);

        // Célula da foto.
        const tdFoto = document.createElement("td");
        if (utilizador.foto) {
            const img = document.createElement("img");
            img.src = utilizador.foto;
            img.alt = "Foto de " + utilizador.nome;
            img.className = "admin-foto";
            tdFoto.appendChild(img);
        } else {
            tdFoto.textContent = "—";
        }
        linha.appendChild(tdFoto);

        // Células de texto.
        linha.appendChild(criarCelula(utilizador.username));
        linha.appendChild(criarCelula(utilizador.nome));
        linha.appendChild(criarCelula(utilizador.email));
        linha.appendChild(criarCelula(utilizador.nif));

        // Célula da ação (botão Remover).
        const tdAcao = document.createElement("td");
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "btn btn-remover";
        botao.textContent = "Remover";
        botao.addEventListener("click", function () {
            removerUtilizador(utilizador.username);
        });
        tdAcao.appendChild(botao);
        linha.appendChild(tdAcao);

        corpo.appendChild(linha);
    });
}

// Cria uma célula <td> com texto.
function criarCelula(texto) {
    const td = document.createElement("td");
    td.textContent = texto;
    return td;
}

// ===================================================================
// Remoção de utilizadores
// ===================================================================

function removerUtilizador(username) {
    if (!confirm("Remover o utilizador \"" + username + "\"?")) {
        return;
    }

    // Filtra o utilizador escolhido para fora da lista.
    let utilizadores = obterUtilizadores();
    utilizadores = utilizadores.filter(function (u) {
        return u.username !== username;
    });
    guardarUtilizadores(utilizadores);

    // Se o utilizador removido era o que tinha sessão, termina a sessão.
    if (localStorage.getItem(CHAVE_LOGADO) === username) {
        localStorage.removeItem(CHAVE_LOGADO);
        window.location.href = "conta.html";
        return;
    }

    // Volta a desenhar a tabela já sem o utilizador removido.
    desenharTabela();
}

// Remove de uma só vez todos os utilizadores selecionados (checkboxes).
function removerSelecionados() {
    const selecionados = Array.from(
        document.querySelectorAll(".selecionar-utilizador:checked")
    ).map(function (c) {
        return c.value;
    });

    if (selecionados.length === 0) {
        alert("Selecione pelo menos um utilizador.");
        return;
    }
    if (!confirm("Remover " + selecionados.length + " utilizador(es) selecionado(s)?")) {
        return;
    }

    // Mantém apenas os que NÃO estão na lista de selecionados.
    const utilizadores = obterUtilizadores().filter(function (u) {
        return !selecionados.includes(u.username);
    });
    guardarUtilizadores(utilizadores);

    // Se o próprio utilizador com sessão foi removido, termina a sessão.
    if (selecionados.includes(localStorage.getItem(CHAVE_LOGADO))) {
        localStorage.removeItem(CHAVE_LOGADO);
        window.location.href = "conta.html";
        return;
    }

    desenharTabela();
}

document.getElementById("remover-selecionados").addEventListener("click", removerSelecionados);

// "Selecionar todos" marca/desmarca todas as checkboxes da tabela.
document.getElementById("selecionar-todos").addEventListener("change", function () {
    const marcar = this.checked;
    document.querySelectorAll(".selecionar-utilizador").forEach(function (c) {
        c.checked = marcar;
    });
});

// ===================================================================
// Logout
// ===================================================================

document.getElementById("logout").addEventListener("click", function () {
    localStorage.removeItem(CHAVE_LOGADO);
    window.location.href = "conta.html";
});

// ===================================================================
// Arranque
// ===================================================================

verificarAcesso();
desenharTabela();
