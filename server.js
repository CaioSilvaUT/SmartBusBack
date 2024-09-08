const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;
const routes = require('./Controllers/routes'); // Verifique o caminho
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Salva o arquivo com o nome original
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// Diretório para servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Aplicar as rotas
app.use('/Controllers', routes);

// Endpoint para upload de PDF
app.post('/uploadPdf', upload.single('file'), (req, res) => {
  try {
    const tipo = req.body.tipo; 
    if (!tipo) {
      return res.status(400).send('Tipo de cartão não especificado.');
    }

    if (!req.file) {
      return res.status(400).send('Nenhum arquivo enviado.');
    }

    console.log('Arquivo recebido:', req.file);
    console.log('Tipo de cartão:', tipo);

    res.status(200).send('Arquivo recebido e processado com sucesso!');
  } catch (error) {
    console.error('Erro ao processar o arquivo:', error.message);
    res.status(500).send('Erro interno do servidor.');
  }
});

app.listen(port, () => {
    console.log(`Aplicação rodando na porta ${port}`);
});
