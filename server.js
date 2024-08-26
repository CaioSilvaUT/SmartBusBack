const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;
const routes = require('./routes');

app.use(cors());
app.use(express.json());

// Usa as rotas definidas no arquivo routes.js
app.use('/', routes);

app.listen(port, () => {
    console.log('Aplicacao rodando na porta 3000');
});
