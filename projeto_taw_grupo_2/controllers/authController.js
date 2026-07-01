const User = require('../models/User'); 
const jwt = require('jsonwebtoken');   
const bcrypt = require('bcrypt');       

// Chave lida da variável de ambiente (definida no .env).
// Sem fallback: se a chave não existir, a aplicação deve falhar em vez de usar um valor inseguro.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não está definido! Configure o ficheiro .env.');
}
const TOKEN_EXPIRATION = '1h';
const SALT_ROUNDS = 10; // Vezes que o algoritmo de hash é aplicado 

// Função de registo de novos utilizadores
exports.register = async (req, res) => {
    try {
        const { username, email, password, nome, telemovel, nif, morada, fotografia } = req.body; // Dados do novo utilizador vêm body

        // Validação não pode existir um outro user na base de dados com o mesmo username ou email.
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Username ou email já registados.'
            });
        }

        // Encriptar a password ANTES de guardar (nunca em texto simples)
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Criar o novo utilizador
        const newUser = new User({
            username,
            email,
            password: hashedPassword, // Guarda o hash, não a password original
            nome,
            telemovel,
            nif,
            morada,
            fotografia
            // flag isAdmin é 'false' por defeito (definido no Schema)
        });

        // Guardar no MongoDB o novo utilizador.
        // se não for possível gravar os dados do utilizador, 
        // o processamento passa para o bloco catch da função.
        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'Utilizador registado com sucesso.',
            user: { username: newUser.username, email: newUser.email, nome: newUser.nome }
        });

    } catch (error) {
        console.error("Erro no registo:", error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor durante o registo.'
        });
    }
};

// Função de login de um utilizador
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // 'identifier' username ou e-mail

        // Encontrar o utilizador com base no username ou e-mail
        const user = await User.findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas.'
            });
        }

        // Comparar a password recebida com o hash guardado (bcrypt trata da comparação segura)
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false, message: 'Credenciais inválidas.'
            });
        }

        // Geração do token
        const payload = {
            id: user._id,
            username: user.username,
            isAdmin: user.isAdmin
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: TOKEN_EXPIRATION
        });

        // Resposta de Sucesso
        // Devolve o utilizador (sem a password) para o frontend preencher o perfil.
        res.status(200).json({
            success: true,
            message: 'Login bem-sucedido.',
            token, // token deve ser guardado no frontend no localStorage
            user: {
                id: user._id,
                username: user.username,
                isAdmin: user.isAdmin,
                nome: user.nome,
                email: user.email,
                telemovel: user.telemovel,
                nif: user.nif,
                morada: user.morada,
                fotografia: user.fotografia
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor durante o login.'
        });
    }
};
