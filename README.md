# Aplicação de Coleção de Livros

Uma aplicação web completa para organizar e gerenciar sua biblioteca pessoal, desenvolvida com Python, Flask, PostgreSQL, HTML, CSS e JavaScript.

## Funcionalidades

- ✅ **Adicionar livros**: Cadastre novos livros com título, autor, ano, gênero e descrição
- ✅ **Listar livros**: Visualize todos os livros da sua coleção em cards organizados
- ✅ **Editar livros**: Atualize as informações de qualquer livro
- ✅ **Excluir livros**: Remova livros da sua coleção com confirmação
- ✅ **Buscar livros**: Pesquise por título, autor ou gênero
- ✅ **Filtrar por gênero**: Filtre livros por categoria
- ✅ **Estatísticas**: Veja o total de livros, gêneros e autores
- ✅ **Interface responsiva**: Funciona em desktop e mobile

## Tecnologias Utilizadas

### Backend
- **Python 3.11+**
- **Flask** - Framework web
- **Flask-SQLAlchemy** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **Flask-CORS** - Suporte a CORS

### Frontend
- **HTML5** - Estrutura das páginas
- **CSS3** - Estilização moderna com gradientes e animações
- **JavaScript** - Interatividade e requisições AJAX
- **Font Awesome** - Ícones

## Pré-requisitos

- Python 3.11 ou superior
- PostgreSQL 12 ou superior
- pip (gerenciador de pacotes Python)

## Instalação

### 1. Clone ou baixe o projeto
```bash
# Se usando git
git clone <url-do-repositorio>
cd book_collection_app

# Ou extraia o arquivo ZIP baixado
```

### 2. Instale as dependências Python
```bash
pip install flask flask-sqlalchemy psycopg2-binary flask-cors
```

### 3. Configure o PostgreSQL

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows:
- Baixe e instale o PostgreSQL do site oficial
- Inicie o serviço PostgreSQL

#### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### 4. Crie o banco de dados
```bash
# Acesse o PostgreSQL como usuário postgres
sudo -u postgres psql

# Execute os comandos SQL:
CREATE DATABASE book_collection;
CREATE USER book_user WITH PASSWORD 'book_password';
GRANT ALL PRIVILEGES ON DATABASE book_collection TO book_user;
\q
```

### 5. Execute a aplicação
```bash
python run.py
```

A aplicação estará disponível em: http://localhost:5000

## Estrutura do Projeto

```
book_collection_app/
├── app/
│   ├── __init__.py          # Configuração da aplicação Flask
│   ├── models.py            # Modelo de dados (Book)
│   └── routes.py            # Rotas da API e páginas
├── static/
│   ├── css/
│   │   └── style.css        # Estilos da aplicação
│   ├── js/
│   │   ├── main.js          # Funções JavaScript globais
│   │   ├── books.js         # JavaScript da página principal
│   │   ├── add_book.js      # JavaScript para adicionar livros
│   │   └── edit_book.js     # JavaScript para editar livros
│   └── img/                 # Imagens (vazio por padrão)
├── templates/
│   ├── base.html            # Template base
│   ├── index.html           # Página principal
│   ├── add_book.html        # Página de adicionar livro
│   └── edit_book.html       # Página de editar livro
├── run.py                   # Arquivo principal para executar a aplicação
└── README.md                # Este arquivo
```

## Configuração do Banco de Dados

A aplicação está configurada para usar PostgreSQL com as seguintes credenciais padrão:

- **Host**: localhost
- **Banco**: book_collection
- **Usuário**: book_user
- **Senha**: book_password

Para alterar essas configurações, edite o arquivo `app/__init__.py`:

```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://usuario:senha@host/banco'
```

## API Endpoints

A aplicação fornece uma API REST para gerenciar livros:

### Livros
- `GET /api/books` - Lista todos os livros
- `GET /api/books/<id>` - Obtém um livro específico
- `POST /api/books` - Cria um novo livro
- `PUT /api/books/<id>` - Atualiza um livro
- `DELETE /api/books/<id>` - Exclui um livro

### Exemplo de dados para criar um livro:
```json
{
    "title": "Dom Casmurro",
    "author": "Machado de Assis",
    "year": 1899,
    "genre": "Romance",
    "description": "Romance clássico da literatura brasileira..."
}
```

## Uso da Aplicação

### 1. Página Principal
- Visualize todos os seus livros em cards organizados
- Use a barra de busca para encontrar livros específicos
- Filtre por gênero usando o dropdown
- Veja estatísticas da sua coleção

### 2. Adicionar Livro
- Clique em "Adicionar Livro"
- Preencha os campos obrigatórios (título e autor)
- Adicione informações opcionais (ano, gênero, descrição)
- Clique em "Salvar Livro"

### 3. Editar Livro
- Na página principal, clique em "Editar" no card do livro
- Modifique as informações desejadas
- Clique em "Atualizar Livro"

### 4. Excluir Livro
- Na página principal, clique em "Excluir" no card do livro
- Confirme a exclusão no modal que aparece

## Solução de Problemas

### Erro de conexão com o banco
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `app/__init__.py`
- Teste a conexão manualmente com `psql`

### Erro de dependências
- Reinstale as dependências: `pip install -r requirements.txt`
- Verifique a versão do Python: `python --version`

### Porta já em uso
- Altere a porta no arquivo `run.py`:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

## Desenvolvimento

### Modo Debug
A aplicação roda em modo debug por padrão, permitindo:
- Recarregamento automático ao modificar arquivos
- Mensagens de erro detalhadas
- Debugger interativo

### Adicionando Funcionalidades
1. **Novos campos**: Modifique `app/models.py` e as páginas HTML
2. **Novas rotas**: Adicione em `app/routes.py`
3. **Novos estilos**: Edite `static/css/style.css`
4. **Nova funcionalidade JS**: Adicione em `static/js/`

## Segurança

⚠️ **Importante**: Esta aplicação é para uso local/desenvolvimento. Para produção:

1. Altere a `SECRET_KEY` em `app/__init__.py`
2. Use variáveis de ambiente para credenciais
3. Configure HTTPS
4. Use um servidor WSGI (Gunicorn, uWSGI)
5. Configure firewall e proxy reverso

## Licença

Este projeto é de código aberto e pode ser usado livremente para fins educacionais e pessoais.

## Suporte

Para dúvidas ou problemas:
1. Verifique a seção "Solução de Problemas"
2. Consulte a documentação do Flask e PostgreSQL
3. Verifique os logs da aplicação no terminal

