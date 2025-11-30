// api.js - Define o objeto BookAPI para centralizar as chamadas AJAX

const BookAPI = {
    // Funcao generica para requisicoes GET
    async get(url) {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        return response.json();
    },

    // Funcao generica para requisicoes POST, PUT, DELETE
    async request(url, method, data = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        
        // Retorna o JSON da resposta (pode ser um objeto de sucesso ou o dado)
        return response.json();
    },

    // Funcoes especificas (exemplo)
    // async getBook(id) {
    //     return this.get(`/api/books/${id}`);
    // },
    
    // async updateBook(id, data) {
    //     return this.request(`/api/books/${id}`, 'PUT', data);
    // }
};
