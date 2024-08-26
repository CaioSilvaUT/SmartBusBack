const database = require('../database/connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class NotificacaoController {
    create(req, res) {
        const { idUser, texto, dataHora, isRead } = req.body;

        database.query(
            'INSERT INTO optbusao.notificacoes (idUser, texto, dataHora, isRead ) VALUES (?, ?, ?, ?)',
            [idUser, texto, dataHora, isRead ],
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

    getById(req, res) {
        const { id } = req.params;
        const query = 'SELECT * FROM optbusao.notificacoes WHERE id = ?';

        database.query(query, [id], (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Erro interno do servidor' });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: 'Notificação não encontrado' });
                return;
            }

            const usuario = results[0];
            res.json(usuario);
        });
    }

    delete(req, res) {
        const { id } = req.params;

        // Check if the user exists
        database.query('SELECT * FROM optbusao.notificacoes WHERE id = ?', [id], (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).json({ error: 'Erro interno do servidor' });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: 'Notificação não encontrado' });
                return;
            }

            // Delete the user
            database.query('DELETE FROM optbusao.notificacoes WHERE id = ?', [id], (deleteError) => {
                if (deleteError) {
                    console.error(deleteError);
                    res.status(500).json({ error: 'Erro ao deletar a notificação' });
                    return;
                }

                res.json({ message: 'Notificação deletada com sucesso' });
            });
        });
    }

}

module.exports = new NotificacaoController;