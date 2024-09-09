# SmartBusBack
# SmartBus Backend

Repositório requerido da matéria de Engenharia de Software, com intuito educativo dos processos de criação de software.

O **SmartBus** é um sistema que busca facilitar o acesso dos usuários de transporte público da cidade de Campo Mourão. O sistema conta com funcionalidades como visualização de horários, rotas, consulta de valores, além de permitir a recarga e renovação da carteirinha de forma completamente remota.

## Estrutura do Projeto

O backend do **SmartBus** segue a arquitetura **MVC** (Model-View-Controller), além de utilizar alguns padrões de projeto, como **Singleton** e **Factory Method**. Abaixo estão as explicações breves sobre esses padrões e como eles são aplicados no sistema.

### **Model-View-Controller (MVC)**

- **Model (Modelo):** Representa a lógica de negócios e manipulação dos dados. Os modelos contêm métodos que lidam diretamente com o banco de dados, como consultas, inserções e atualizações. Exemplo: `CartaoModel` manipula os dados da tabela de cartões.
  
- **View (Visão):** No contexto de uma API, a "View" é representada pelas respostas que a API retorna, em JSON ou outro formato adequado. Essas respostas são consumidas pelo frontend.
  
- **Controller (Controlador):** O controlador é responsável por receber as requisições do cliente, interagir com os modelos e devolver uma resposta apropriada. Exemplo: o arquivo `routes.js` define as rotas e mapeia as requisições HTTP para os métodos dos modelos.

## **Design patterns**

Como requerido nesta aplicação estão sendo utilizados dois **design patterns** o **singleton** e o **factory method**

### 1. **Singleton**

O padrão **Singleton** é utilizado para garantir que o sistema tenha apenas uma única instância de um objeto, como a conexão com o banco de dados, que será reutilizada em diferentes partes do sistema. 

**Exemplo:**

```javascript
let connection;

async function getConnection() {
    if (!connection) {
        const mysql = require('mysql2/promise');
        connection = await mysql.createConnection({ /* configuração */ });
    }
    return connection;
}

module.exports = { getConnection };
```

Aqui, a função getConnection() garante que uma única instância da conexão com o banco de dados seja criada e usada em todo o sistema.

### 2. **Factory Method**


O **Factory Method** é um padrão de criação utilizado para abstrair a lógica de criação dos objetos. No backend do SmartBus, ele é aplicado nos modelos para criação de instâncias que interagem com o banco de dados.

```javascript
const UsuarioModel = require("../Model/Usuario");
const NotificacaoModel = require("../Model/Notificacao");
const CartaoModel = require("../Model/Cartao");

```
Aqui, diferentes modelos são criados para cada entidade (usuário, notificação, cartão), permitindo que o sistema trabalhe com a lógica específica de cada uma delas sem expor a criação direta de instâncias.

## Como rodar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/CaioSilvaUT/SmartBusBack.git
cd smartbus-backend
```

### 2. Instalar as dependências
Certifique-se de que o Node.js esteja instalado na sua máquina. Em seguida, instale as dependências do projeto com o comando:

```bash
npm install
```

### 3. Configurar o Banco de Dados
O projeto utiliza MySQL como banco de dados. Crie um banco de dados no MySQL e configure as credenciais de acesso no arquivo config/database.js.

```javascript
// Exemplo de configuração do banco de dados:
const mysql = require('mysql2/promise');

async function getConnection() {
    return await mysql.createConnection({
        host: 'localhost',
        user: 'seu-usuario', //altere seu-usuario pelo usuario do seu banco de dados
        password: 'sua-senha', //altere sua-senha pela senha do seu banco de dados
        database: 'eng' //caso deseje alterar o nome do database mudanças terão de ser feitas no arquivo database/connection.js
    });
}

```

### 4. Rodar o servidor
Após configurar o banco de dados e instalar as dependências, execute o servidor com o comando:

```bash
npm run dev
```

