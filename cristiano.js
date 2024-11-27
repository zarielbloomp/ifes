// Instalação necessária: npm install express sqlite3 body-parser
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database(':memory:'); // Mude para 'alunos.db' para persistência de dados.

app.use(bodyParser.json());

// Cria a tabela no banco de dados
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS alunos (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, age INTEGER)");
});

// Servir o HTML e outros arquivos estáticos
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cadastro de Alunos</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                }
                .message {
                    padding: 20px;
                    border-radius: 5px;
                    color: white;
                }
                .success {
                    background-color: green;
                }
                .error {
                    background-color: red;
                }
                form {
                    margin-top: 20px;
                }
                input {
                    padding: 10px;
                    margin: 10px;
                    width: 200px;
                    border-radius: 5px;
                    border: 1px solid #ccc;
                }
                button {
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                table {
                    width: 60%;
                    margin: 20px auto;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: center;
                }
                a {
                    color: red;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <h1>Cadastro de Alunos</h1>
            <form id="alunoForm">
                <input type="text" id="name" placeholder="Nome do aluno" required>
                <input type="number" id="age" placeholder="Idade do aluno" required>
                <button type="submit">Cadastrar</button>
            </form>
            <h2>Lista de Alunos Cadastrados</h2>
            <table id="alunosTable">
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Idade</th>
                    <th>Ação</th>
                </tr>
            </table>

            <script>
                // Função para buscar e exibir alunos
                function carregarAlunos() {
                    fetch('/alunos')
                        .then(response => response.json())
                        .then(data => {
                            const alunosTable = document.getElementById('alunosTable');
                            alunosTable.innerHTML = '<tr><th>ID</th><th>Nome</th><th>Idade</th><th>Ação</th></tr>';
                            data.forEach(aluno => {
                                const row = alunosTable.insertRow();
                                row.innerHTML = \`<td>\${aluno.id}</td>
                                                  <td>\${aluno.name}</td>
                                                  <td>\${aluno.age}</td>
                                                  <td><a href="#" onclick="deletarAluno(\${aluno.id})">Excluir</a></td>\`;
                            });
                        });
                }

                // Função para cadastrar um novo aluno
                document.getElementById('alunoForm').addEventListener('submit', function (e) {
                    e.preventDefault();
                    const name = document.getElementById('name').value;
                    const age = document.getElementById('age').value;

                    fetch('/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, age })
                    }).then(() => {
                        carregarAlunos();
                        document.getElementById('name').value = '';
                        document.getElementById('age').value = '';
                    });
                });

                // Função para deletar aluno
                function deletarAluno(id) {
                    fetch(\`/delete/\${id}\`, { method: 'DELETE' })
                        .then(() => carregarAlunos());
                }

                // Carregar alunos ao iniciar
                carregarAlunos();
            </script>
        </body>
        </html>
    `);
});

// Endpoint para adicionar aluno
app.post('/add', (req, res) => {
    const { name, age } = req.body;
    db.run("INSERT INTO alunos (name, age) VALUES (?, ?)", [name, age], function (err) {
        if (err) return res.status(500).send(err.message);
        res.send({ id: this.lastID, name, age });
    });
});

// Endpoint para buscar todos os alunos
app.get('/alunos', (req, res) => {
    db.all("SELECT * FROM alunos", (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.json(rows);
    });
});

// Endpoint para deletar aluno
app.delete('/delete/:id', (req, res) => {
    db.run("DELETE FROM alunos WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).send(err.message);
        res.sendStatus(200);
    });
});

// Inicializa o servidor
app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
