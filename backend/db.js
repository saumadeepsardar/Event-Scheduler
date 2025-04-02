const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'user1', // Replace with your MySQL username
  password: '123456', // Replace with your MySQL password
  database: 'eventschedulerpublic'
});

module.exports = pool;