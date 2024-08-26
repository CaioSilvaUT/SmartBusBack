const database = require('../database/connection');


class CartaoController {
    create(req, res) {
        const { idUser, dataCriacao, dataVencimento, valor, tipo } = req.body;

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
                res.json(results);
            }
        );
    }

    getByIdUser(req, res) {
        const { idUser } = req.params;
        const query = 'SELECT * FROM optbusao.cartoes WHERE idUser = ?';

        database.query(query, [idUser], (error, results) => {
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

}

module.exports = new CartaoController;