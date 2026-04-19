# Clínica Vida+ — Projeto Integrado (Landing Page + API + Agendamento + Docker)

Projeto desenvolvido para a disciplina de Desenvolvimento de Soluções para Clínica de Saúde.

## Autor
- Nome: Filipe de Almeida Pantoja da Costa
- RA: 72500912
- GitHub: https://github.com/FilipeTIceub

---

## Escopo implementado

### Projeto 01 — Landing Page Estática
- Título da clínica
- Seção de serviços com imagens
- Equipe fictícia (3 membros com foto e cargo)
- Formulário estático (Nome, E-mail, Cidade, Estado)
- Estrutura HTML com níveis de cabeçalho

### Projeto 02 — API de Profissionais
- Listagem de profissionais
- Filtro por especialidade
- Busca por nome
- Endpoint de saúde da API

### Projeto 03 — Sistema de Agendamento
- Criação de agendamento
- Listagem de agendamentos
- Consulta por CPF
- Cancelamento de agendamento (por ID e por CPF+ID)

### Projeto 04 — Banco + Containers
- MySQL com scripts SQL (schema + seed)
- API Node.js (Express + mysql2)
- Adminer para administração do banco
- Subida completa com Docker Compose

---

## Estrutura do projeto

```text
clinica-vida-plus/
├─ docker-compose.yml
├─ README.md
├─ frontend/
│  ├─ index.html
│  └─ img/
│     ├─ consulta.jpg
│     ├─ exames.jpg
│     ├─ nutricao.jpg
│     ├─ joao.jpg
│     ├─ maria.jpg
│     └─ pedro.jpg
├─ backend/
│  ├─ server.js
│  ├─ package.json
│  ├─ Dockerfile
│  └─ .dockerignore
└─ database/
   ├─ schema.sql
   └─ seed.sql
```

---

## Como executar localmente

### Pré-requisitos
- Docker Desktop instalado e em execução
- Virtualização habilitada no BIOS/UEFI

### Comandos
```bash
docker compose down -v
docker compose up -d --build
docker compose ps
```

---

## Endpoints e acessos

- API Health: `http://localhost:3000/health`
- Profissionais: `http://localhost:3000/profissionais`
- Profissionais por especialidade:
  `http://localhost:3000/profissionais?especialidade=cardiologia`
- Busca por nome:
  `http://localhost:3000/profissionais/nome/joao`
- Listar agendamentos:
  `http://localhost:3000/agendamentos`
- Consultar agendamento por CPF:
  `http://localhost:3000/agendamentos/cpf/03848970104`
- Adminer: `http://localhost:8080`

### Login do Adminer
- Sistema: `MySQL`
- Servidor: `db`
- Usuário: `root`
- Senha: `root`
- Base: `clinica`

---

## Exemplos de testes (curl)

Criar agendamento:
```bash
curl -X POST http://localhost:3000/agendamentos \
-H "Content-Type: application/json" \
-d "{\"paciente_id\":1,\"profissional_id\":1,\"data_agendamento\":\"2026-04-25 10:00:00\"}"
```

Consultar por CPF:
```bash
curl http://localhost:3000/agendamentos/cpf/03848970104
```

Cancelar por CPF + ID:
```bash
curl -X DELETE http://localhost:3000/agendamentos/cpf/03848970104/1
```
