const User = require('../models/User'); 
const bcrypt = require('bcrypt');       

const SALT_ROUNDS = 10;

// Função auxiliar: verifica se o utilizador autenticado 
// é o próprio OU é admin
function isSelfOrAdmin(req) {
    return req.user.isAdmin || req.user.id === req.params.id;
}

// GET /api/users -> Listar todos os utilizadores (apenas admin). 
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        console.error("Erro ao listar utilizadores:", error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
};

// GET /api/users/:id -> Obter um utilizador por id 
// (o próprio ou admin)
exports.getUserById = async (req, res) => {
    try {
        if (!isSelfOrAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Sem permissão para ver este utilizador.' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Erro ao obter utilizador:", error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
};

// PUT /api/users/:id -> Atualizar um utilizador 
// (o próprio ou admin)
exports.updateUser = async (req, res) => {
    try {
        if (!isSelfOrAdmin(req)) {
            return res.status(403).json({ success: false, message: 'Sem permissão para alterar este utilizador.' });
        }

        const updates = { ...req.body };

        // Impedir que um utilizador 
        // comum se promova a admin
        if (!req.user.isAdmin) {
            delete updates.isAdmin;
        }

        // Proteção: não deixar retirar privilégios ao ÚLTIMO administrador.
        if (updates.isAdmin === false) {
            const alvo = await User.findById(req.params.id);
            if (alvo && alvo.isAdmin) {
                const totalAdmins = await User.countDocuments({ isAdmin: true });
                if (totalAdmins <= 1) {
                    return res.status(409).json({
                        success: false,
                        message: 'Não é possível retirar o único administrador. Atribua primeiro outro administrador.'
                    });
                }
            }
        }

        // Se a password for atualizada,
        // é encriptada antes de guardar
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true } 
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });
        }

        res.status(200).json({ success: true, message: 'Utilizador atualizado.', user: updatedUser });
    } catch (error) {
        console.error("Erro ao atualizar utilizador:", error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
};

// DELETE /api/users/:id -> Apagar um utilizador
//  (apenas admin)
exports.deleteUser = async (req, res) => {
    try {
        const alvo = await User.findById(req.params.id);
        if (!alvo) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado.' });
        }

        // Proteção: não deixar remover o ÚLTIMO administrador.
        if (alvo.isAdmin) {
            const totalAdmins = await User.countDocuments({ isAdmin: true });
            if (totalAdmins <= 1) {
                return res.status(409).json({
                    success: false,
                    message: 'Não é possível remover o único administrador. Atribua primeiro outro administrador.'
                });
            }
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Utilizador apagado com sucesso.' });
    } catch (error) {
        console.error("Erro ao apagar utilizador:", error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
};
