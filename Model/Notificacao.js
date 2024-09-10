const { getConnection } = require("../database/connection");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

class NotificacaoModel {
  async create(req, res) {
    const { idUser, texto, dataHora } = req.body;

    try {
      const connection = await getConnection();
      const [results] = await connection.query(
        "INSERT INTO notificacoes (idUser, texto, dataHora) VALUES (?, ?, ?)",
        [idUser, texto, dataHora]
      );
      console.log(results);
      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async getAll(req, res) {
    const query = "SELECT * FROM notificacoes";

    try {
      const connection = await getConnection();
      const [results] = await connection.query(query);
      console.log(results);
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async getById(req, res) {
    const { id } = req.params;
    const query = "SELECT * FROM notificacoes WHERE id = ?";

    try {
      const connection = await getConnection();
      const [results] = await connection.query(query, [id]);
      if (results.length === 0) {
        res.status(404).json({ error: "Notificação não encontrada" });
        return;
      }
      res.json(results[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async getByUserId(req, res) {
    const { idUser } = req.params;
    const query = "SELECT * FROM notificacoes WHERE idUser = ?";

    try {
      const connection = await getConnection();
      const [results] = await connection.query(query, [idUser]);
      if (results.length === 0) {
        res.status(404).json({ error: "Nenhuma notificação encontrada" });
        return;
      }
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  async delete(req, res) {
    const { id } = req.params;

    try {
      const connection = await getConnection();

      // Check if the notification exists
      const [results] = await connection.query(
        "SELECT * FROM notificacoes WHERE id = ?",
        [id]
      );
      if (results.length === 0) {
        res.status(404).json({ error: "Notificação não encontrada" });
        return;
      }

      // Delete the notification
      await connection.query("DELETE FROM notificacoes WHERE id = ?", [id]);
      res.json({ message: "Notificação deletada com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao deletar a notificação" });
    }
  }
}

module.exports = new NotificacaoModel();
