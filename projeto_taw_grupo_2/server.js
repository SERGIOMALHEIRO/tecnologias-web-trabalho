const express = require('express');
const mongoose = require('mongoose'); // Importa o Mongoose para interação com a base de dados
const app = express(); // Cria uma instância da aplicação. Será utilizado para definir as rotas, configurações e middleware do servidor

const cors = require('cors');       // segurança do frontend
const bcrypt = require('bcrypt');   // hashing de passwords
const helmet = require('helmet');   // segurança geral
const morgan = require('morgan');   // logging dos pedidos HTTP do cliente
const path = require('path');       // para construir caminhos de ficheiros (pasta public)

const PORT = process.env.PORT || 3000; 

// Middlewares
// limit '10mb' -> permite fotos de perfil em base64 (o default de 100kb é pequeno demais)
app.use(express.json({ limit: '10mb' })); // Processa pedidos com header Content-Type: application/json.

app.use(cors());            // permitir todas as origens
app.use(morgan('tiny'));    // presets que podem usar -> dev, combined, common, ou short
// helmet com CSP ajustada: permite imagens em data: (fotos base64) e o iframe do YouTube.
// referrerPolicy: envia a origem ao YouTube (necessário para o embed funcionar; senão dá "Erro 153").
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:"],                  // permite fotos de perfil em base64
            "frame-src": ["'self'", "https://www.youtube.com"], // permite o vídeo do index.html
        },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// Servir ficheiros estáticos do frontend (HTML, CSS, JS, imagens) a partir da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
const authRoutes = require('./routes/authRoutes'); // Importar as rotas de autenticação
const userRoutes = require('./routes/userRoutes'); // Importar as rotas de gestão de utilizadores
app.use('/api/auth', authRoutes);  // Rotas de autenticação sob o prefixo /api/auth
app.use('/api/users', userRoutes); // Rotas de gestão de utilizadores sob o prefixo /api/users

// string de conexão a partir da variável de ambiente (MONGO_URI)
const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/projeto-db';

mongoose.connect(DB_URI) // Inicia a tentativa de conexão assíncrona à base de dados MongoDB
    .then(() => { // executada apenas se a ligação à base de dados for bem-sucedida
        console.log('Ligação bem-sucedida ao MongoDB!');
        app.listen(PORT, () => { // Servidor iniciado
            console.log(`O Servidor Express encontra-se em execução na porta ${PORT}`);
        });
    })
    .catch(err => { // executada apenas se a ligação ao MongoDB falhar
        console.error('ERRO: Falha na ligação ao MongoDB:', err.message);
    });
