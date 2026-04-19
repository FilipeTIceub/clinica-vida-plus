CREATE DATABASE IF NOT EXISTS clinica;
USE clinica;

CREATE TABLE IF NOT EXISTS profissionais (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  especialidade VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS pacientes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  paciente_id INT NOT NULL,
  profissional_id INT NOT NULL,
  data_agendamento DATETIME NOT NULL,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (profissional_id) REFERENCES profissionais(id)
);
