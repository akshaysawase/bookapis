const express = require("express");
var app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const contactRoute = require("./routes/contact.route");
const mysql = require("mysql");
const con = require("./config/dbconfig");
const session = require("express-session");


const port = 3000;

dotenv.config();
process.env.JWT_TOKEN;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/contact", contactRoute);

app.get("/", (req,res)=>{
    res.json({message : "Its working fine..."});
});

app.listen(process.env.PORT || port ,(err)=>{
    if(err)throw err;
    console.log(`Server is Ready And Running on Port ${process.env.PORT}`);
})