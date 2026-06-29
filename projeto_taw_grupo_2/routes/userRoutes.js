const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Middlewares de proteção

// Todas as rotas abaixo exigem um token JWT válido (protect).
// Algumas exigem ainda privilégios de administrador (adminOnly).
router.get('/', protect, adminOnly, userController.getAllUsers);   // Listar todos (só admin)
router.get('/:id', protect, userController.getUserById);          // Obter um (próprio ou admin)
router.put('/:id', protect, userController.updateUser);           // Atualizar (próprio ou admin)
router.delete('/:id', protect, adminOnly, userController.deleteUser); // Apagar (só admin)

module.exports = router;
