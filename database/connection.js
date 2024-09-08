const mysql = require('mysql2/promise');

async function initDB() {
    try {
        // Conectar ao MySQL
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'eng'
        });

        // Criação do banco de dados, se não existir
        await connection.query(`CREATE DATABASE IF NOT EXISTS eng`);

        // Criação das tabelas, se não existirem
        await connection.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT(11) NOT NULL AUTO_INCREMENT,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                senha VARCHAR(255) NOT NULL,
                telefone VARCHAR(15) DEFAULT NULL,
                cpf VARCHAR(14) NOT NULL,
                is_adm TINYINT(1) DEFAULT NULL,
                PRIMARY KEY (id)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS cartoes (
                id INT(11) NOT NULL AUTO_INCREMENT,
                idUser INT(11) NOT NULL,
                dataCriacao DATE NOT NULL,
                dataVencimento DATE NOT NULL,
                valor DOUBLE NOT NULL,
                tipo INT(11) NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY (idUser) REFERENCES usuarios(id)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS notificacoes (
                id INT(11) NOT NULL AUTO_INCREMENT,
                idUser INT(11) NOT NULL,
                texto TEXT NOT NULL,
                dataHora DATETIME NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY (idUser) REFERENCES usuarios(id)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS notificacao_read (
                id INT(11) NOT NULL AUTO_INCREMENT,
                idUser INT(11) NOT NULL,
                idNotify INT(11) NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY (idUser) REFERENCES usuarios(id),
                FOREIGN KEY (idNotify) REFERENCES notificacoes(id)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS solicitacoes_cartao (
                id INT(11) NOT NULL AUTO_INCREMENT,
                idUser INT(11) NOT NULL,
                pdfPath VARCHAR(255) NOT NULL,
                tipo INT(11) NOT NULL,
                valor DOUBLE NOT NULL DEFAULT 0.00,
                status ENUM('pendente', 'aprovado', 'rejeitado') NOT NULL DEFAULT 'pendente',
                createdAt TIMESTAMP NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                FOREIGN KEY (idUser) REFERENCES usuarios(id)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS solicitacoes_saldo (
                id INT(11) NOT NULL AUTO_INCREMENT,
                idUser INT(11) NOT NULL,
                idCartao INT(11) NOT NULL,
                valor DOUBLE NOT NULL,
                status ENUM('pendente', 'aprovado', 'rejeitado') NOT NULL DEFAULT 'pendente',
                createdAt TIMESTAMP NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                FOREIGN KEY (idUser) REFERENCES usuarios(id),
                FOREIGN KEY (idCartao) REFERENCES cartoes(id)
            );
        `);

        console.log('Database initialized');

        // Encerrar a conexão
        await connection.end();
    } catch (err) {
        console.error('Erro ao inicializar o banco de dados:', err);
    }
}

// Executar a função de inicialização
initDB();

module.exports = initDB;
