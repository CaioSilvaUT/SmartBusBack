const { getConnection } = require('../database/connection');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class UsuarioModel {
    async newUser(req, res) {
        const { nome, email, senha, telefone, is_adm } = req.body;
        const hashedSenha = bcrypt.hashSync(senha, 10); // Hash da senha

        try {
            const connection = await getConnection();
            const [results] = await connection.query(
                'INSERT INTO usuarios (nome, email, senha, telefone, is_adm) VALUES (?, ?, ?, ?, ?)',
                [nome, email, hashedSenha, telefone, is_adm]
            );
            console.log(results);
            res.json(results);
        } catch (err) {
            console.error(err);
            res.status(401).json({ error: 'Erro interno do servidor' });
        }
    }


    logoutUser = (req, res) => {
        res.cookie('jwt', '', {
          httpOnly: true,
          expires: new Date(0),
        });
        res.status(200).json({ message: 'Usuário saiu com sucesso' });
      }

    async login(req, res) {
        const { email, senha } = req.body;

        try {
            const connection = await getConnection();
            const [results] = await connection.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            const usuario = results[0];
            const senhaCorreta = bcrypt.compareSync(senha, usuario.senha); // Verifica se a senha está correta

            if (results.length === 0) {
                res.status(401).json({ error: 'Credenciais inválidas' });
                return;
            }

            if (!senhaCorreta) {
                res.status(401).json({ error: 'Senha inválidas' });
                return;
            }

            const token = jwt.sign({ id: usuario.id }, 'chave-secreta');
            res.json({ id: usuario.id, token, is_adm: usuario.is_adm }); // is_adm tá no JSON
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async showUserById(req, res) {
        const { id } = req.params;

        try {
            const connection = await getConnection();
            const [results] = await connection.query('SELECT * FROM usuarios WHERE id = ?', [id]);

            if (results.length === 0) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }

            const usuario = results[0];
            res.json(usuario);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async showUser(req, res) {
        try {
            const connection = await getConnection();
            const [results] = await connection.query('SELECT * FROM usuarios');
            console.log(results);
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async deleteUser(req, res) {
        const { id } = req.params;

        try {
            const connection = await getConnection();
            const [results] = await connection.query('SELECT * FROM usuarios WHERE id = ?', [id]);

            if (results.length === 0) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }

            await connection.query('DELETE FROM usuarios WHERE id = ?', [id]);
            res.json({ message: 'Usuário deletado com sucesso' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao deletar o usuário' });
        }
    }

    async updateUser(req, res) {
        const { nome, email, telefone, senha } = req.body; // Incluindo a senha
        const { id } = req.params;

        try {
            const connection = await getConnection();
            let query = 'UPDATE usuarios SET nome = ?, email = ?, telefone = ?';
            const values = [nome, email, telefone, id];

            if (senha) {
                const hashedSenha = bcrypt.hashSync(senha, 10); // Hash da nova senha
                query += ', senha = ?';
                values.splice(3, 0, hashedSenha);
            }

            query += ' WHERE id = ?';

            await connection.query(query, values);
            res.json({ message: 'Usuário atualizado com sucesso' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}

module.exports = new UsuarioModel();
