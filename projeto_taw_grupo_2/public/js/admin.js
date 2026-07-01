// ===================================================================
// Painel de Administração: listar e remover utilizadores via API.
// (Etapa 2: usa GET/DELETE /api/users com token JWT de administrador.)
// ===================================================================

const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

function tokenAtual() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

function utilizadorAutenticado() {
    const dados = localStorage.getItem(AUTH_USER_KEY);
    return dados ? JSON.parse(dados) : null;
}

// ===================================================================
// Controlo de acesso: só um ADMIN autenticado pode ver este painel.
// ===================================================================

function verificarAcesso() {
    const user = utilizadorAutenticado();
    if (!tokenAtual() || !user) {
        // Sem sessão -> volta para o login.
        window.location.href = "conta.html";
        return false;
    }
    if (!user.isAdmin) {
        // Autenticado, mas não é administrador.
        alert("Acesso restrito a administradores.");
        window.location.href = "conta.html";
        return false;
    }
    return true;
}

// ===================================================================
// Construção dinâmica da tabela (a partir da API)
// ===================================================================

async function desenharTabela() {
    const corpo = document.getElementById("corpo-utilizadores");
    const semUtilizadores = document.getElementById("sem-utilizadores");
    const tabela = document.getElementById("tabela-utilizadores");

    corpo.innerHTML = "";

    let utilizadores = [];
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${tokenAtual()}` } // rota só de admin
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.message || "Erro ao obter a lista de utilizadores.");
            return;
        }
        utilizadores = data.users || [];
    } catch (e) {
        console.error('Erro de rede ao listar utilizadores:', e);
        alert("Falha de comunicação com o servidor.");
        return;
    }

    if (utilizadores.length === 0) {
        tabela.classList.add("escondido");
        semUtilizadores.classList.remove("escondido");
        return;
    }
    tabela.classList.remove("escondido");
    semUtilizadores.classList.add("escondido");

    utilizadores.forEach(function (utilizador) {
        const linha = document.createElement("tr");

        // Checkbox de seleção (valor = _id, usado para o DELETE).
        const tdCheck = document.createElement("td");
        const check = document.createElement("input");
        check.type = "checkbox";
        check.className = "selecionar-utilizador";
        check.value = utilizador._id;
        check.dataset.username = utilizador.username;
        tdCheck.appendChild(check);
        linha.appendChild(tdCheck);

        // Foto.
        const tdFoto = document.createElement("td");
        if (utilizador.fotografia) {
            const img = document.createElement("img");
            img.src = utilizador.fotografia;
            img.alt = "Foto de " + utilizador.nome;
            img.className = "admin-foto";
            tdFoto.appendChild(img);
        } else {
            tdFoto.textContent = "—";
        }
        linha.appendChild(tdFoto);

        // Texto.
        linha.appendChild(criarCelula(utilizador.username));
        linha.appendChild(criarCelula(utilizador.nome));
        linha.appendChild(criarCelula(utilizador.email));
        linha.appendChild(criarCelula(utilizador.nif));

        // Ação (Remover, Promover/Despromover Admin, Reset Password).
        const tdAcao = document.createElement("td");

        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.className = "btn btn-remover btn-acao";
        btnRemover.textContent = "Remover";
        btnRemover.addEventListener("click", function () {
            removerUtilizador(utilizador._id, utilizador.username);
        });
        tdAcao.appendChild(btnRemover);

        // Botão de promover/retirar admin (muda consoante o estado atual).
        const btnAdmin = document.createElement("button");
        btnAdmin.type = "button";
        btnAdmin.className = "btn btn-acao";
        btnAdmin.textContent = utilizador.isAdmin ? "Retirar Admin" : "Tornar Admin";
        btnAdmin.addEventListener("click", function () {
            alterarAdmin(utilizador._id, utilizador.username, !utilizador.isAdmin);
        });
        tdAcao.appendChild(btnAdmin);

        // Botão de repor a password.
        const btnPass = document.createElement("button");
        btnPass.type = "button";
        btnPass.className = "btn btn-secundario btn-acao";
        btnPass.textContent = "Reset Password";
        btnPass.addEventListener("click", function () {
            resetPassword(utilizador._id, utilizador.username);
        });
        tdAcao.appendChild(btnPass);

        linha.appendChild(tdAcao);

        corpo.appendChild(linha);
    });
}

function criarCelula(texto) {
    const td = document.createElement("td");
    td.textContent = texto || "";
    return td;
}

// ===================================================================
// Remoção de utilizadores -> DELETE /api/users/:id (com token admin)
// ===================================================================

async function apagarPorId(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tokenAtual()}` }
    });
    return response;
}

async function removerUtilizador(id, username) {
    if (!confirm("Remover o utilizador \"" + username + "\"?")) return;
    try {
        const response = await apagarPorId(id);
        if (!response.ok) {
            const data = await response.json();
            alert(data.message || "Erro ao remover.");
            return;
        }
        desenharTabela();
    } catch (e) {
        console.error('Erro de rede ao remover:', e);
        alert("Falha de comunicação com o servidor.");
    }
}

async function removerSelecionados() {
    const selecionados = Array.from(
        document.querySelectorAll(".selecionar-utilizador:checked")
    ).map(function (c) { return c.value; });

    if (selecionados.length === 0) {
        alert("Selecione pelo menos um utilizador.");
        return;
    }
    if (!confirm("Remover " + selecionados.length + " utilizador(es) selecionado(s)?")) return;

    try {
        // Apaga cada um (em paralelo) na API.
        const respostas = await Promise.all(selecionados.map(function (id) { return apagarPorId(id); }));

        // Recolhe mensagens de eventuais bloqueios (ex.: último administrador).
        const falhas = [];
        for (const r of respostas) {
            if (!r.ok) {
                const data = await r.json().catch(function () { return {}; });
                falhas.push(data.message || "Erro ao remover um utilizador.");
            }
        }
        if (falhas.length > 0) {
            alert(falhas.join("\n"));
        }
        desenharTabela();
    } catch (e) {
        console.error('Erro de rede ao remover selecionados:', e);
        alert("Falha de comunicação com o servidor.");
    }
}

// ===================================================================
// Promover / retirar admin -> PUT /api/users/:id { isAdmin }
// ===================================================================

async function alterarAdmin(id, username, tornarAdmin) {
    const acao = tornarAdmin ? "promover a administrador" : "retirar privilégios de administrador a";
    if (!confirm(`Deseja ${acao} "${username}"?`)) return;
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAtual()}` },
            body: JSON.stringify({ isAdmin: tornarAdmin })
        });
        const data = await response.json();
        if (!response.ok) { alert(data.message || "Erro ao alterar o papel."); return; }
        desenharTabela(); // recarrega a tabela com o novo estado
    } catch (e) {
        console.error('Erro de rede ao alterar admin:', e);
        alert("Falha de comunicação com o servidor.");
    }
}

// ===================================================================
// Reset da password de um utilizador -> PUT /api/users/:id { password }
// (a API encripta a nova password com bcrypt)
// ===================================================================

async function resetPassword(id, username) {
    const nova = prompt(`Nova password para "${username}":`);
    if (nova === null) return;                 // cancelou
    if (nova.trim().length < 4) {
        alert("A password deve ter pelo menos 4 caracteres.");
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAtual()}` },
            body: JSON.stringify({ password: nova })
        });
        const data = await response.json();
        if (!response.ok) { alert(data.message || "Erro ao repor a password."); return; }
        alert(`Password de "${username}" reposta com sucesso.`);
    } catch (e) {
        console.error('Erro de rede ao repor password:', e);
        alert("Falha de comunicação com o servidor.");
    }
}

document.getElementById("remover-selecionados").addEventListener("click", removerSelecionados);

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
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = "conta.html";
});

// ===================================================================
// Arranque
// ===================================================================

if (verificarAcesso()) {
    desenharTabela();
}
