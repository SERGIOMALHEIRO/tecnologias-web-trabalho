const jwt = require('jsonwebtoken'); //  verificar tokens JWT

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não está definido! Configure o ficheiro .env.');
}

// Middleware: protege rotas exigindo um token JWT válido no cabeçalho Authorization
exports.protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // O token deve vir no formato: "Authorization: Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Acesso negado. Token de autenticação em falta.'
        });
    }

    const token = authHeader.split(' ')[1]; // Extrai apenas o token (a seguir a "Bearer ")

    try {
        // Verifica a assinatura e se a validade do token esta correcta
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Guarda os dados do utilizador (id, username, isAdmin) no pedido
        next();             // Token válido -> continua para a rota seguinte
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado.'
        });
    }
};

// Middleware: restringe o acesso apenas a administradores
// (usar SEMPRE depois de 'protect')
exports.adminOnly = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Acesso restrito a administradores.'
        });
    }
    next();
};
