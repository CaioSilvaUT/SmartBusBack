// debitar.test.js
const CartaoModel = require("../Model/Cartao"); // Corrigido para "Cartao"
const { getConnection } = require('../database/connection');

jest.mock('./caminho_para_o_arquivo_de_conexao'); // Mock da conexão do banco de dados

describe('CartaoModel.debitar', () => {
    let req;
    let res;

    beforeEach(() => {
        // Mock do objeto req (requisição)
        req = {
            params: { idCartao: 1 } // Simula um cartão de id 1
        };

        // Mock do objeto res (resposta)
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('deve debitar o valor do cartão e registrar a viagem', async () => {
        const mockConnection = {
            query: jest.fn()
        };

        // Mock do comportamento da conexão do banco de dados
        getConnection.mockResolvedValue(mockConnection);

        // Mock da query para verificar o cartão
        mockConnection.query
            .mockResolvedValueOnce([[{ id: 1, valor: 5.00, idUser: 1 }]]) // Retorna o cartão com saldo 5.00
            .mockResolvedValueOnce(null) // Mock da atualização do saldo do cartão
            .mockResolvedValueOnce(null); // Mock da inserção no histórico

        await CartaoController.debitar(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Débito realizado com sucesso!', cardId: 1 });

        // Verifica se as queries corretas foram chamadas
        expect(mockConnection.query).toHaveBeenCalledWith(
            'SELECT * FROM cartoes WHERE id = ?',
            [1]
        );
        expect(mockConnection.query).toHaveBeenCalledWith(
            'UPDATE cartoes SET valor = ? WHERE id = ?',
            [3.00, 1] // Saldo atualizado (5.00 - 2.00)
        );
        expect(mockConnection.query).toHaveBeenCalledWith(
            'INSERT INTO historico_viagens (idUser, idCartao, data_viagem, origem, destino, valor) VALUES (?, ?, NOW(), "UTFPR", "Terminal", ?)',
            [1, 1, 2.00]
        );
    });

    it('deve retornar erro se o cartão não for encontrado', async () => {
        const mockConnection = {
            query: jest.fn()
        };

        getConnection.mockResolvedValue(mockConnection);

        // Mock da query para retornar nenhum cartão
        mockConnection.query.mockResolvedValueOnce([[]]);

        await CartaoController.debitar(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Cartão não encontrado' });
    });

    it('deve retornar erro se o saldo for insuficiente', async () => {
        const mockConnection = {
            query: jest.fn()
        };

        getConnection.mockResolvedValue(mockConnection);

        // Mock da query para retornar um cartão com saldo insuficiente
        mockConnection.query.mockResolvedValueOnce([[{ id: 1, valor: 1.00, idUser: 1 }]]);

        await CartaoController.debitar(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Saldo insuficiente' });
    });

    it('deve retornar erro se houver falha interna no servidor', async () => {
        const mockConnection = {
            query: jest.fn()
        };

        getConnection.mockResolvedValue(mockConnection);

        // Mock de uma exceção sendo lançada durante a execução da query
        mockConnection.query.mockRejectedValue(new Error('Erro interno'));

        await CartaoController.debitar(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno do servidor' });
    });
});
