const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'your_password', // Replace with your MySQL password
  database: 'EventSchedulerPublic'
});

module.exports = pool;