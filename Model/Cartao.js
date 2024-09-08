const { getConnection } = require('../database/connection');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de PDFs
const upload = multer({
    dest: 'uploads/', // Pasta de destino para os arquivos  
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb('Apenas arquivos PDF são permitidos!');
    }
});

class CartaoNodel {
    async create(req, res) {
        const { idUser, dataCriacao, dataVencimento, valor, tipo } = req.body;

        try {
            const connection = await getConnection();

            // Verifica se já existe um cartão com o idUser fornecido
            const [results] = await connection.query(
                'SELECT * FROM cartoes WHERE idUser = ?',
                [idUser]
            );

            if (results.length > 0) {
                return res.status(400).json({ error: 'Já existe um cartão para este usuário.' });
            }

            // Caso não exista, insere o novo cartão
            const [insertResults] = await connection.query(
                'INSERT INTO cartoes (idUser, dataCriacao, dataVencimento, valor, tipo) VALUES (?, ?, ?, ?, ?)',
                [idUser, dataCriacao, dataVencimento, valor, tipo]
            );

            res.status(201).json({ message: 'Cartão criado com sucesso!', cardId: insertResults.insertId });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getByIdUser(req, res) {
        const { id } = req.params; 
        const query = 'SELECT * FROM cartoes WHERE idUser = ?';

        try {
            const connection = await getConnection();
            const [results] = await connection.query(query, [id]);

            if (results.length === 0) {
                return res.json(null);
            }

            res.json(results[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async getById(req, res) {
        const { id } = req.params;
        const query = 'SELECT * FROM cartoes WHERE id = ?';

        try {
            const connection = await getConnection();
            const [results] = await connection.query(query, [id]);

            if (results.length === 0) {
                return res.status(404).json({ error: 'Cartão não encontrado' });
            }

            res.json(results[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async delete(req, res) {
        const { id } = req.params;

        try {
            const connection = await getConnection();

            // Check if the card exists
            const [results] = await connection.query('SELECT * FROM cartoes WHERE id = ?', [id]);
            if (results.length === 0) {
                return res.status(404).json({ error: 'Cartão não encontrado' });
            }

            // Delete the card
            await connection.query('DELETE FROM cartoes WHERE id = ?', [id]);
            res.json({ message: 'Cartão deletado com sucesso' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao deletar o cartão' });
        }
    }


    async debitar(req, res) {
        const { idCartao } = req.params; 
        const valor = 2.00;
    
        try {
            const connection = await getConnection();
    
            // Verifica se o cartão existe
            const [cartaoResults] = await connection.query(
                'SELECT * FROM cartoes WHERE id = ?',
                [idCartao]
            );
    
            if (cartaoResults.length === 0) {
                return res.status(404).json({ error: 'Cartão não encontrado' });
            }
    
            const cartao = cartaoResults[0];
            const saldoAtual = cartao.valor;
            const novoSaldo = saldoAtual - valor;
    
            if (novoSaldo < 0) {
                return res.status(400).json({ error: 'Saldo insuficiente' });
            }
    
            // Atualiza o saldo do cartão
            await connection.query(
                'UPDATE cartoes SET valor = ? WHERE id = ?',
                [novoSaldo, idCartao]
            );
    
            // Registra a viagem no histórico
            await connection.query(
                'INSERT INTO historico_viagens (idUser, idCartao, data_viagem, origem, destino, valor) VALUES (?, ?, NOW(), "UTFPR", "Terminal", ?)',
                [cartao.idUser, idCartao, valor]
            );
    
            res.status(200).json({ message: 'Débito realizado com sucesso!', cardId: idCartao });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async solicitarCartao(req, res) {
        const { idUser } = req.params;
        const { tipo } = req.body; // Obtenha o tipo do cartão do corpo da requisição

        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
        }

        if (!tipo) {
            return res.status(400).json({ error: 'O tipo de cartão é obrigatório.' });
        }

        const pdfPath = req.file.path;

        try {
            const connection = await getConnection();
            const query = `
                INSERT INTO solicitacoes_cartao (idUser, pdfPath, tipo, status) 
                VALUES (?, ?, ?, 'pendente')
            `;
            const [results] = await connection.query(query, [idUser, pdfPath, tipo]);
            res.status(201).json({ message: 'Solicitação de cartão enviada com sucesso!', requestId: results.insertId });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao salvar a solicitação.' });
        }
    }

    async getSolicitacoesPendentes(req, res) {
        const query = 'SELECT * FROM solicitacoes_cartao WHERE status = "pendente"';

        try {
            const connection = await getConnection();
            const [results] = await connection.query(query);
            res.json(results);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao buscar solicitações.' });
        }
    }

    async processarSolicitacao(req, res) {
        const { id } = req.params;
        const { status } = req.body;

        if (!['aprovado', 'rejeitado'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido.' });
        }

        try {
            const connection = await getConnection();

            // Atualizar status da solicitação
            await connection.query('UPDATE solicitacoes_cartao SET status = ? WHERE id = ?', [status, id]);

            if (status === 'aprovado') {
                // Se a solicitação for aprovada, renovamos o cartão
                const [solicitacaoResults] = await connection.query('SELECT idUser FROM solicitacoes_cartao WHERE id = ?', [id]);
                if (solicitacaoResults.length === 0) {
                    return res.status(500).json({ error: 'Erro ao buscar solicitação.' });
                }

                const { idUser } = solicitacaoResults[0];
                const novaDataVencimento = new Date();
                novaDataVencimento.setFullYear(novaDataVencimento.getFullYear() + 1);

                await connection.query(
                    'UPDATE cartoes SET dataVencimento = ? WHERE idUser = ?',
                    [novaDataVencimento, idUser]
                );

                res.json({ message: 'Cartão renovado com sucesso.' });
            } else {
                res.json({ message: `Solicitação ${status} com sucesso.` });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao processar solicitação.' });
        }
    }

    async getHistoricoViagens(req, res) {
        const { idUser } = req.params;

        try {
            const connection = await getConnection();
            const [cartaoResults] = await connection.query(
                'SELECT * FROM cartoes WHERE idUser = ?',
                [idUser]
            );
            if (cartaoResults.length === 0) {
                return res.status(404).json({ error: 'Cartão não encontrado.' });
            }
            const idCartao = cartaoResults[0].id;
            const [viagens] = await connection.query(
                'SELECT * FROM viagens WHERE idCartao = ? ORDER BY data DESC',
                [idCartao]
            );
            if (viagens.length === 0) {
                return res.status(404).json({ message: 'Nenhuma viagem encontrada.' });
            }
            res.status(200).json({ historicoViagens: viagens });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao buscar histórico de viagens.' });
        }
    }

    async adicionarSaldo(req, res) {
        const { idUser } = req.params;
        const { valorAdicionado } = req.body;
        const valorAdicionadoFloat = parseFloat(valorAdicionado);

        if (isNaN(valorAdicionadoFloat)) {
            return res.status(400).json({ error: 'Valor inválido para adição de saldo.' });
        }

        try {
            const connection = await getConnection();
            const [cartaoResults] = await connection.query(
                'SELECT * FROM cartoes WHERE idUser = ?',
                [idUser]
            );

            if (cartaoResults.length === 0) {
                return res.status(404).json({ error: 'Cartão não encontrado.' });
            }

            const cartao = cartaoResults[0];
            const hoje = new Date();
            const dataVencimento = new Date(cartao.dataVencimento);

            if (hoje > dataVencimento) {
                // Cartão vencido, não pode adicionar saldo
                return res.status(403).json({ 
                    error: 'Cartão expirado. Envie uma solicitação de renovação.'
                });
            } // Cartão ativo, atualiza o saldo
            const novoSaldo = cartao.valor + valorAdicionadoFloat;
            await connection.query(
                'UPDATE cartoes SET valor = ? WHERE idUser = ?',
                [novoSaldo, idUser]
            );

            res.status(200).json({ message: 'Saldo adicionado com sucesso.', novoSaldo });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Erro ao adicionar saldo.' });
        }
    }
}

module.exports = new CartaoNodel();
module.exports.upload = upload;
