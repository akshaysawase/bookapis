const mysql = require("mysql");

var con = mysql.createConnection({
    host:'localhost',
    user : 'root',
    password :'akki',
    database : 'book'
});

con.connect((err)=>{
    if(err)throw err;
    console.log("Database Connection Established !");
});

module.exports = con;