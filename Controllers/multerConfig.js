const multer = require("multer");
const path = require("path");

// Configuração para salvar os arquivos no diretório "uploads/"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Evitar conflitos de nome
  },
});

const upload = multer({ storage });

module.exports = upload;
