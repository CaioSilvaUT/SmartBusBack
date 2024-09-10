const express = require("express");
const router = express.Router();
const UsuarioModel = require("../Model/Usuario"); // Corrigido para "Usuario"
const NotificacaoModel = require("../Model/Notificacao"); // Corrigido para "Notificacao"
const CartaoModel = require("../Model/Cartao"); // Corrigido para "Cartao"
const multer = require("multer");
const load = multer({ dest: "uploads/" }); // Diretório de destino para os arquivos
const upload = require("./multerConfig"); // Importar a configuração do multer
const path = require("path");
// Servir arquivos estáticos da pasta 'uploads'
router.get("/baixarPdf/:pdfPath", (req, res) => {
  const pdfPath = req.params.pdfPath;
  const fullPath = path.join(__dirname, "../uploads", pdfPath);
  res.download(fullPath, (err) => {
    if (err) {
      return res.status(500).json({ error: "Erro ao baixar o arquivo." });
    }
  });
});
// Rotas para Usuário
router.post("/login", UsuarioModel.login);
router.post("/newUser", UsuarioModel.newUser);
router.get("/showUser", UsuarioModel.showUser);
router.get("/showUserId/:id", UsuarioModel.showUserById);
router.delete("/deleteUser/:id", UsuarioModel.deleteUser);
router.put("/updateUser/:id", UsuarioModel.updateUser);
router.post("/logout", UsuarioModel.logoutUser);

// Rotas para Notificação
router.post("/createNotificacao", NotificacaoModel.create);
router.get("/getByIdNotificacao/:id", NotificacaoModel.getById);
router.get("/getNotificacaoByUserId/:idUser", NotificacaoModel.getByUserId);
router.delete("/deleteNotificacao/:id", NotificacaoModel.delete);
router.get("/getAllNotifi", NotificacaoModel.getAll);

// Rotas para Cartão
router.post("/createCartao", CartaoModel.create);
router.get("/getByIdCartao/:id", CartaoModel.getById);
router.get("/getByIdUserCartao/:id", CartaoModel.getByIdUser);
router.delete("/deleteCartao/:id", CartaoModel.delete);
router.put("/debitar/:idCartao", CartaoModel.debitar);
router.get("/historicoViagens/:idUser", CartaoModel.getHistoricoViagens);

// Rota para upload de PDF e solicitação de cartão
router.post(
  "/solicitarCartao/:idUser",
  load.single("file"),
  CartaoModel.solicitarCartao
);

// Rotas para o administrador
router.get("/solicitacoesPendentes", CartaoModel.getSolicitacoesPendentes);
router.put("/processarSolicitacao/:id", CartaoModel.processarSolicitacao);
// Rota para adicionar saldo
router.post("/adicionarSaldo/:idUser", CartaoModel.adicionarSaldo);

module.exports = router;
