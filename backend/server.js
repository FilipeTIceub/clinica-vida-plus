const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'clinica',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

/* ----------------------------- Helpers ----------------------------- */
const ok = (res, data, status = 200) => res.status(status).json(data);

const fail = (res, status, message, detail = null) =>
  res.status(status).json({ erro: message, ...(detail ? { detalhe: detail } : {}) });

const onlyDigits = (v = '') => String(v).replace(/\D/g, '');

const isValidCpf = (cpf) => onlyDigits(cpf).length === 11;

const isValidDateTime = (value) => !Number.isNaN(new Date(value).getTime());

async function connectWithRetry(retries = 20, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      pool = mysql.createPool(dbConfig);
      await pool.query('SELECT 1');
      console.log('✅ Conectado ao MySQL');
      return;
    } catch (err) {
      console.log(`⏳ Tentativa ${i}/${retries} - aguardando MySQL...`);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/* ----------------------------- Rotas ----------------------------- */
app.get('/health', async (_, res) => {
  try {
    await pool.query('SELECT 1');
    return ok(res, { status: 'ok', db: 'up' });
  } catch (err) {
    return fail(res, 500, 'Banco indisponível', err.message);
  }
});

/* PROFISSIONAIS */
app.get('/profissionais', async (req, res) => {
  try {
    const { especialidade } = req.query;

    if (especialidade) {
      const [rows] = await pool.query(
        'SELECT id, nome, especialidade FROM profissionais WHERE especialidade = ?',
        [especialidade]
      );
      return ok(res, rows);
    }

    const [rows] = await pool.query('SELECT id, nome, especialidade FROM profissionais');
    return ok(res, rows);
  } catch (err) {
    return fail(res, 500, 'Erro ao buscar profissionais', err.message);
  }
});

app.get('/profissionais/nome/:nome', async (req, res) => {
  try {
    const nome = `%${req.params.nome}%`;
    const [rows] = await pool.query(
      'SELECT id, nome, especialidade FROM profissionais WHERE nome LIKE ?',
      [nome]
    );

    if (!rows.length) return fail(res, 404, 'Nenhum profissional encontrado');
    return ok(res, rows);
  } catch (err) {
    return fail(res, 500, 'Erro na busca por nome', err.message);
  }
});

/* PACIENTES (útil para testes e demo) */
app.get('/pacientes', async (_, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome, cpf FROM pacientes ORDER BY id');
    return ok(res, rows);
  } catch (err) {
    return fail(res, 500, 'Erro ao listar pacientes', err.message);
  }
});

/* AGENDAMENTOS */
app.post('/agendamentos', async (req, res) => {
  try {
    const { paciente_id, profissional_id, data_agendamento } = req.body;

    if (!paciente_id || !profissional_id || !data_agendamento) {
      return fail(res, 400, 'paciente_id, profissional_id e data_agendamento são obrigatórios');
    }

    if (!isValidDateTime(data_agendamento)) {
      return fail(res, 400, 'data_agendamento inválida');
    }

    // Valida existência do paciente
    const [[paciente]] = await pool.query('SELECT id FROM pacientes WHERE id = ?', [paciente_id]);
    if (!paciente) return fail(res, 404, 'Paciente não encontrado');

    // Valida existência do profissional
    const [[profissional]] = await pool.query('SELECT id FROM profissionais WHERE id = ?', [profissional_id]);
    if (!profissional) return fail(res, 404, 'Profissional não encontrado');

    const [result] = await pool.query(
      'INSERT INTO agendamentos (paciente_id, profissional_id, data_agendamento) VALUES (?, ?, ?)',
      [paciente_id, profissional_id, data_agendamento]
    );

    return ok(res, { sucesso: true, id: result.insertId }, 201);
  } catch (err) {
    return fail(res, 500, 'Erro ao criar agendamento', err.message);
  }
});

app.get('/agendamentos', async (_, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.id,
        p.nome AS paciente,
        p.cpf,
        pr.nome AS profissional,
        pr.especialidade,
        a.data_agendamento
      FROM agendamentos a
      JOIN pacientes p ON p.id = a.paciente_id
      JOIN profissionais pr ON pr.id = a.profissional_id
      ORDER BY a.data_agendamento
    `);
    return ok(res, rows);
  } catch (err) {
    return fail(res, 500, 'Erro ao listar agendamentos', err.message);
  }
});

app.get('/agendamentos/cpf/:cpf', async (req, res) => {
  try {
    const cpf = onlyDigits(req.params.cpf);
    if (!isValidCpf(cpf)) return fail(res, 400, 'CPF inválido');

    const [rows] = await pool.query(`
      SELECT 
        a.id,
        p.nome AS paciente,
        p.cpf,
        pr.nome AS profissional,
        pr.especialidade,
        a.data_agendamento
      FROM agendamentos a
      JOIN pacientes p ON p.id = a.paciente_id
      JOIN profissionais pr ON pr.id = a.profissional_id
      WHERE p.cpf = ?
      ORDER BY a.data_agendamento
    `, [cpf]);

    if (!rows.length) return fail(res, 404, 'Nenhum agendamento encontrado para este CPF');
    return ok(res, rows);
  } catch (err) {
    return fail(res, 500, 'Erro ao consultar por CPF', err.message);
  }
});

app.delete('/agendamentos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'ID inválido');

    const [result] = await pool.query('DELETE FROM agendamentos WHERE id = ?', [id]);
    if (result.affectedRows === 0) return fail(res, 404, 'Agendamento não encontrado');

    return ok(res, { sucesso: true, removidos: result.affectedRows });
  } catch (err) {
    return fail(res, 500, 'Erro ao cancelar agendamento', err.message);
  }
});

app.delete('/agendamentos/cpf/:cpf/:id', async (req, res) => {
  try {
    const cpf = onlyDigits(req.params.cpf);
    const id = Number(req.params.id);

    if (!isValidCpf(cpf)) return fail(res, 400, 'CPF inválido');
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'ID inválido');

    const [result] = await pool.query(`
      DELETE a FROM agendamentos a
      JOIN pacientes p ON p.id = a.paciente_id
      WHERE a.id = ? AND p.cpf = ?
    `, [id, cpf]);

    if (result.affectedRows === 0) {
      return fail(res, 404, 'Agendamento não encontrado para este CPF');
    }

    return ok(res, { sucesso: true, removidos: result.affectedRows });
  } catch (err) {
    return fail(res, 500, 'Erro ao cancelar por CPF', err.message);
  }
});

/* 404 padrão */
app.use((req, res) => fail(res, 404, `Rota não encontrada: ${req.method} ${req.originalUrl}`));

/* ----------------------------- Start ----------------------------- */
(async () => {
  try {
    await connectWithRetry();
    app.listen(PORT, () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar API:', err.message);
    process.exit(1);
  }
})();