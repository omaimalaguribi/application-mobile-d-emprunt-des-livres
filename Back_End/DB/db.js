const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',         // Changez selon vos identifiants
  password: '',         // Changez selon votre mot de passe
  database: 'book_app', // Nom de votre base de données
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;