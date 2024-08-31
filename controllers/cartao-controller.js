const database = require('../database/connection');
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
        exports.upload = upload;
    }
});

class CartaoController {
    create(req, res) {
        const { idUser, dataCriacao, dataVencimento, valor, tipo } = req.body;
    
        // Verifica se já existe um cartão com o idUser fornecido
        database.query(
            'SELECT * FROM optbusao.cartoes WHERE idUser = ?',
            [idUser],
            (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Erro interno do servidor' });
                }
                
                // Se resultados não forem vazios, significa que já existe um cartão
                if (results.length > 0) {
                    return res.status(400).json({ error: 'Já existe um cartão para este usuário.' });
                }
    
                // Caso não exista, insere o novo cartão
                database.query(
                    'INSERT INTO optbusao.cartoes (idUser, dataCriacao, dataVencimento, valor, tipo) VALUES (?, ?, ?, ?, ?)',
                    [idUser, dataCriacao, dataVencimento, valor, tipo],
                    (err, results) => {
                        if (err) {
                            console.error(err);
                            res.status(500).json({ error: 'Erro interno do servidor' });
                            return;
                        }
                        console.log(results);
                        res.status(201).json({ message: 'Cartão criado com sucesso!', cardId: results.insertId });
                    }
                );
            }
        );
    }

    getByIdUser(req, res) {
        const { id } = req.params; 
        const query = 'SELECT * FROM optbusao.cartoes WHERE idUser = ?';
        
        database.query(query, [id], (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Erro interno do servidor' });
                return;
            }
    
            if (results.length === 0) {
                res.json(null);
                return;
            }
    
            const cartao = results[0];
            res.json(cartao);
        });
    }

    getById(req, res) {
        const { id } = req.params;
        const query = 'SELECT * FROM optbusao.cartoes WHERE id = ?';

        database.query(query, [id], (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Erro interno do servidor' });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: 'cartão não encontrado' });
                return;
            }

            const usuario = results[0];
            res.json(usuario);
        });
    }

    delete(req, res) {
        const { id } = req.params;

        // Check if the user exists
        database.query('SELECT * FROM optbusao.cartoes WHERE id = ?', [id], (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Erro interno do servidor' });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: 'cartão não encontrado' });
                return;
            }

            // Delete the user
            database.query('DELETE FROM optbusao.cartoes WHERE id = ?', [id], (deleteError) => {
                if (deleteError) {
                    console.error(deleteError);
                    res.status(500).json({ error: 'Erro ao deletar o cartão' });
                    return;
                }

                res.json({ message: 'cartão deletado com sucesso' });
            });
        });
    }

    createTable(req, res) {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS cartoes (
                idUser INT NOT NULL,
                dataCriacao DATETIME NOT NULL,
                dataVencimento DATETIME NOT NULL,
                valor DECIMAL(10, 2) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                PRIMARY KEY (idUser)
            );
        `;
    
        database.query(createTableQuery, (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Erro interno do servidor' });
                return;
            }
    
            res.json({ message: 'Tabela cartoes criada com sucesso' });
        });
    }

    

    debitar(req, res) {
        const { idUser } = req.params; 
        const valor = 2.00;

        
        // Verifica se já existe um cartão com o idUser fornecido
        database.query(
            'SELECT * FROM optbusao.cartoes WHERE idUser = ?',
            [idUser],
            (err, results) => {
                
                const saldoAtual = results[0].valor;
                const novoSaldo = saldoAtual - valor;
                console.log(novoSaldo);
                // Caso não exista, insere o novo cartão
                database.query(
                    'UPDATE optbusao.cartoes SET valor = ? WHERE idUser = ?',
                    [novoSaldo, idUser],
                    (err, results) => {
                        if (err) {
                            console.error(err);
                            res.status(500).json({ error: 'Erro interno do servidor' });
                            return;
                        }
                        console.log(results);
                        res.status(201).json({ message: 'Cartão ATUALZIADO com sucesso!', cardId: idUser});
                    }
                );
            }
        );
      
    }

    // Rota para solicitar um cartão com PDF de dados
    solicitarCartao(req, res) {
        const { idUser } = req.params;
        const { tipo } = req.body; // Obtenha o tipo do cartão do corpo da requisição
    
        // Verifica se o arquivo foi enviado
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
        }
    
        if (!tipo) {
            return res.status(400).json({ error: 'O tipo de cartão é obrigatório.' });
        }
    
        const pdfPath = req.file.path;
    
        // Insere a solicitação no banco de dados
        const query = `
            INSERT INTO solicitacoes_cartao (idUser, pdfPath, tipo, status) 
            VALUES (?, ?, ?, 'pendente')
        `;
        database.query(query, [idUser, pdfPath, tipo], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao salvar a solicitação.' });
            }
            res.status(201).json({ message: 'Solicitação de cartão enviada com sucesso!', requestId: results.insertId });
        });
    }
    
    // Rota para o administrador ver todas as solicitações pendentes
    getSolicitacoesPendentes(req, res) {
        const query = 'SELECT * FROM solicitacoes_cartao WHERE status = "pendente"';
        database.query(query, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao buscar solicitações.' });
            }
            res.json(results);
        });
    }

    // Rota para aprovar ou rejeitar uma solicitação
    processarSolicitacao(req, res) {
        const { id } = req.params;
        const { status } = req.body; // 'aprovado' ou 'rejeitado'
    
        if (!['aprovado', 'rejeitado'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido.' });
        }
    
        const queryUpdateStatus = 'UPDATE solicitacoes_cartao SET status = ? WHERE id = ?';
        
        // Primeiro, atualizamos o status da solicitação
        database.query(queryUpdateStatus, [status, id], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao processar a solicitação.' });
            }
    
            // Se a solicitação for aprovada, criamos o cartão
            if (status === 'aprovado') {
                const queryGetSolicitacao = 'SELECT idUser, tipo FROM solicitacoes_cartao WHERE id = ?';
                
                database.query(queryGetSolicitacao, [id], (err, results) => {
                    if (err || results.length === 0) {
                        console.error(err);
                        return res.status(500).json({ error: 'Erro ao buscar detalhes da solicitação.' });
                    }
    
                    const { idUser, tipo } = results[0];
                    const dataCriacao = new Date(); // data atual
                    const dataVencimento = new Date();
                    dataVencimento.setFullYear(dataVencimento.getFullYear() + 1); // 1 ano de validade
                    const valorInicial = 0.0;
    
                    const queryCreateCartao = 
                        'INSERT INTO optbusao.cartoes (idUser, dataCriacao, dataVencimento, valor, tipo) VALUES (?, ?, ?, ?, ?)';
    
                    database.query(queryCreateCartao, [idUser, dataCriacao, dataVencimento, valorInicial, tipo], (err, results) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: 'Erro ao criar o cartão.' });
                        }
                        res.json({ message: `Solicitação aprovada e cartão criado com sucesso para o usuário ${idUser}.` });
                    });
                });
            } else {
                res.json({ message: `Solicitação ${status} com sucesso.` });
            }
        });
    }
    
    adicionarSaldo(req, res) {
        const { idUser } = req.params;
        const { valorAdicionado } = req.body; // Valor a ser adicionado ao saldo
        // Converta o valorAdicionado para float
        const valorAdicionadoFloat = parseFloat(valorAdicionado);
        if (isNaN(valorAdicionadoFloat)) {
            return res.status(400).json({ error: 'Valor inválido para adição de saldo.' });
        }
        
        // Busca o cartão do usuário
        database.query(
            'SELECT * FROM optbusao.cartoes WHERE idUser = ?',
            [idUser],
            (err, results) => {
                if (err || results.length === 0) {
                    console.error(err);
                    return res.status(500).json({ error: 'Erro ao buscar cartão ou cartão não encontrado.' });
                }
    
                const saldoAtual = results[0].valor;
                const novoSaldo = saldoAtual + valorAdicionadoFloat;
                // Atualiza o saldo do cartão
                database.query(
                    'UPDATE optbusao.cartoes SET valor = ? WHERE idUser = ?',
                    [novoSaldo, idUser],
                    (err, updateResults) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: 'Erro ao adicionar saldo.' });
                        }
                        res.status(200).json({ message: 'Saldo adicionado com sucesso.', novoSaldo: novoSaldo });
                    }
                );
            }
        );
    }
    
    

}

module.exports = new CartaoController;
module.exports.upload = upload;