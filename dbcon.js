var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_thweattm',
  password        : 'jeep1990',
  database        : 'cs340_thweattm'
});

module.exports.pool = pool;