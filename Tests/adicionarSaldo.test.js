const { getConnection } = require('../database/connection');
const CartaoModel = require('../Model/Cartao');

jest.mock('../database/connection',);

describe('CartaoModel.adicionarSaldo', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            params: { idUser: 1 }, // Simula um usuário com id 1
            body: { valorAdicionado: 10.00 } // Valor a ser adicionado
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('deve retornar erro se o valor adicionado for inválido', async () => {
        req.body.valorAdicionado = 'invalid'; // Valor inválido

        await CartaoModel.adicionarSaldo(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Valor inválido para adição de saldo.' });
    });

    it('deve retornar erro se o cartão não for encontrado', async () => {
        const mockConnection = {
            query: jest.fn()
        };

        getConnection.mockResolvedValue(mockConnection);

        mockConnection.query.mockResolvedValueOnce([[]]); // Cartão não encontrado

        await CartaoModel.adicionarSaldo(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Cartão não encontrado.' });
    });

    it('deve retornar erro se o cartão estiver expirado', async () => {
        const mockConnection = {
            query: jest.fn()
        };

        getConnection.mockResolvedValue(mockConnection);

        // Simula um cartão expirado
        const expiredCard = { idUser: 1, valor: 50.00, dataVencimento: '2023-01-01' };
        mockConnection.query.mockResolvedValueOnce([[expiredCard]]);

        await CartaoModel.adicionarSaldo(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Cartão expirado. Envie uma solicitação de renovação.' });
    });

    it('deve adicionar saldo com sucesso', async () => {
        const mockConnection = {
            query: jest.fn()
        };

        getConnection.mockResolvedValue(mockConnection);

        // Simula um cartão ativo
        const activeCard = { idUser: 1, valor: 50.00, dataVencimento: '2025-01-01' };
        mockConnection.query.mockResolvedValueOnce([[activeCard]]); // Seleciona o cartão
        mockConnection.query.mockResolvedValueOnce(null); // Atualiza o saldo

        await CartaoModel.adicionarSaldo(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Saldo adicionado com sucesso.', novoSaldo: 60.00 });

        // Verifica se a query de atualização foi chamada com o valor correto
        expect(mockConnection.query).toHaveBeenCalledWith(
            'UPDATE cartoes SET valor = ? WHERE idUser = ?',
            [60.00, 1]
        );
    });

    it('deve retornar erro se houver uma falha interna no servidor', async () => {
        const mockConnection = {
            query: jest.fn().mockRejectedValue(new Error('Erro interno do servidor'))
        };

        getConnection.mockResolvedValue(mockConnection);

        await CartaoModel.adicionarSaldo(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Erro ao adicionar saldo.' });
    });
});
