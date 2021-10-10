const bcrypt = require("bcrypt");
  const sql = require("../config/dbconfig");
  const express = require("express");
  var nodemailer = require('nodemailer');
  const fs = require("fs");

  const router = express.Router();
  const jwt = require("jsonwebtoken");
  require('dotenv').config();  
  var vCardsJS = require('vcards-js');

  
  exports.getAllContact = (req,res) =>  {
    const id = req.token.id;
    const name = req.token.username;
    console.log("/getAllContact hits");
    console.log(id);
    const query = `select * from pq_addcontact where createdBy = ${id} order by id`;
    sql.query(query, (err,results)=>{
        if(err){
            return res.json({
                Error : "DB Error "+err,
            });
        }
        if(results ==""){
            return res.json({
                message : "Data Not Found !",
            })
        }
        res.json({
            message : "Contacts Successfully Fetched !!",
            result : results
        })
        
    });
   }
  

exports.createContact = (req, res) =>{
    console.log("Create Contact Hits");
    const contact = req.body;
    
    if(!contact){
        console.log("Contact Not Recieved !");
        return res.json({
            Error : "Contact Not Recieved !"
        });
    }
   
    const query = `INSERT INTO pq_addcontact  
    (name, mobile, email, address, country, isdelete, image, createdAt, createdBy) 
    VALUES  
    ( ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const queryOptions = [contact.firstname, contact.mobile, contact.email, contact.address, contact.country, contact.isdeleted, contact.image, new Date(), contact.createdBy];
    sql.query(query, queryOptions,(err, results)=>{
        if(err){
            console.log("DB ERROR - "+err);
            return res.json({
                Error : "DB Error - "+err
            });
        }
        if(results ==""){
            console.log("DB Result is Null");
            return res.json({
                Error : "DB Result is Null"
            });
        }
        return res.status(200).json({
            message : "Contact Saved Successfully !!"
        })
    });
    console.log("CreateContact Hits");

}

function writeToCSVFile(users, req, res) {
    const filename = 'contacts.csv';
    fs.writeFile(filename, extractAsCSV(users), err => {
      if (err) {
        console.log('Error writing to csv file', err);
      } else {
        res.download(filename, (err) => {
            if (err) {
              res.status(500).send({
                message: "Could not download the file. " + err,
              });
            }
          });

        console.log(`saved as ${filename}`);
      }
    });
  }
  
  function extractAsCSV(users) {
    const header = ["Name, Email, Mobile , Address, Country"];
    const rows = users.map(user =>
       `${user.name}, ${user.email}, ${user.mobile}, ${user.address}, ${user.country}, `
    );
    return header.concat(rows).join("\n");
  }



exports.newUser = async(req,res)=>{
    console.log("Sign Up Hits");

    const user = req.body;
    const check = `select * from pq_signup where email = '${user.email}'`;
    sql.query(check , async(err, results)=>{
        if(err){
            return res.json({
                err : "Error Occured in check query"
            })
        }
        if(results != ""){

            console.log(results);
            return res.json({
                    errmsg : "Email is Already Registered !"
                });
            
        }else if(results == ""){
            const query = `INSERT INTO pq_signup 
    (first, last, email, password, createdAt, isDeleted) 
    VALUES  
    ( ?, ?, ?, ?, ?, ?)`;

    const hashedPassword = await bcrypt.hash(user.password , 12);
    console.log("Hashed - "+hashedPassword);
    const queryOptions = [user.firstname, user.lastname, user.email, hashedPassword, new Date(), 0 ];

    sql.query(query,queryOptions, (err, results)=>{
            if(err){
                console.log("Error in Db - "+err);
                return res.json({
                    Error : "DB Error - "+err
                });
                
            }
            if(results == ""){
                console.log("Data Not Found !");
                return res.json({
                    Error : "No Data Found !"
                });
            }

            return res.status(200).json({
                message : "You're Registered Successfully ! Please log in.."
            })
    });    

        }
        // return;
    });


    
    
}

exports.deleteContact = (req,res) =>{
    console.log("Delete Contact Hits");
    var id = req.params.id;
    console.log(typeof(id));
    console.log(id);
    try{
        const query = `DELETE FROM pq_addcontact WHERE id = ${id} `;
        sql.query(query, (err, result) =>{
            if(err){
                return res.json({
                    Error : "DB Error - "+err
                });
            }
            if(result == ""){
                return res.json({
                    Error : "Contact not found !"
                })
            }
            return res.status(200).json({
                message : "Deleted Successfully !",
            })
        } )
    }catch{
        res.status(404).json({
            message : "Something broke in Database",
        })
        console.log("delete Catch");
    }
    console.log("delete hit");
}


exports.signin = async (req,res)=>{
   console.log("Sign in Hits...");
    const{emailid, password} = req.body;
    const query = `select * from pq_signup where email = '${emailid}'`;
    sql.query(query, async(err, results)=>{
        if(err){
            console.log("DB ERROR - "+err);
            return res.json({
                Error : "DB Error - "+err
            });
        }
        if(results == ''){
            console.log("Invalid Credits");
            return res.json({
                Error : "Invalid Credits",
                code : 0
            })
        }
        
        try{
           const isMatch = await bcrypt.compare(password , results[0].password);
           if(!isMatch){
               console.log("Invalid Password")
               return res.json({
                   Error : "Invalid Password !",
                   code : 0
               });
           }
        }catch{
            console.log("bcrypt Catch");
        }
        
        try{
            const token = jwt.sign({ username : results[0].first, id : results[0].id }, process.env.JWT_TOKEN,{
                algorithm :'HS256',
                expiresIn : "1d"
            });
            console.log("Token Created - "+token);
            return res.json({
                message : "You're Logged in Successfully !",
                token : token,
                id : results[0].id,
                name : results[0].first
            });
    
        }catch{
            console.log("Error Creating Token");
            return res.status(500).json({
                Error : "Error Creating Token"
            })
        }
    });
    

}


exports.singleContact = (req,res) =>{
    console.log("singlecontact hits");
    const cid = req.params.cid;

    const query = `select * from pq_addcontact where id= ${cid}`;

    sql.query(query, (err, results) =>{
        if(err){
            console.log("DB ERROR - "+err);
            return res.json({
                Error : "DB Error - "+err
            });
        }
        if(results ==''){
            console.log("No Contacts Found !");
            return res.json({
                Error : "No Contact Found !",
            });
        }

        return res.status(200).json({
            message : "Contact Recieved !",
            contact : results
        });
    });
}


exports.updateContact = (req,res)=>{

    console.log("Update Contact hits..");
    const contact = req.body;
    const query = `update pq_addcontact set name ='${contact.firstname}', mobile = ${contact.mobile}, email = '${contact.email}', address = '${contact.address}', country = '${contact.country}' where id = ${contact.id}`;

    sql.query(query, (err, results)=>{
        if(err){
            console.log("DB Error - "+err);
            return res.json({
                Error : "DB Error - "+err
            });
        }
        if(results == ""){
            console.log("No Changes made ! to update query ");
            return res.json({
                Error : "Nothing Changed !"
            });
        }

        return res.json({
            message : "Contact Updated Successfully !"
        });
    });
}


exports.checkPassword = (req,res) =>{
    console.log("Change Password Hits !");
    const {password , id } = req.body;
    
    const query = `select * from pq_signup where id = ${id}`;

    sql.query(query, async(err, results)=>{
        if(err){
            console.log("DB Error "+err);
            return res.json({
                Error : "DB Error - "+err
            });
        }
        try{
            const isMatch = await bcrypt.compare(password, results[0].password);
            if(!isMatch){
                console.log("Invalid Password !");
                return res.json({
                    err : "Invalid Password ",
                    status : 0
                })
            }else{
                console.log("password Correct !");
                return res.json({
                    msg : "Password Validated !",
                    status : 1
                });
            }
        }catch{
            console.log("bcrypt Error");
        }
    });
}

exports.changePassword = async(req, res)=>{
    console.log("Change HITS");

    const {newPass, id} = req.body;
    const hashNew = await bcrypt.hash(newPass,12);

    const query = `update pq_signup set password = '${hashNew}' where id = ${id}`;

    sql.query(query , (err, results) =>{
        if(err){
            console.log(err);
            return res.json({
                error : "Db error "+err,
                status : 0
            });
        }
        if(results){
            return res.json({
                msg : "Password updated Successfully !"
            });
        }
    });

}

exports.csvFile = ( req, res )=> {
    
    const uid = req.query.id;

    const query = `SELECT * FROM pq_addcontact WHERE createdBy=${uid}`;

    sql.query(query , (err, results)=>{
        if(err){
            console.log("Error - "+err);
            return res.json({
                err : "DB Error - "+err
            });
        }
        if(results == ""){
            return res.json({
                msg : "No Contact Found !"
            });
        }else if(results){
            writeToCSVFile(results, req, res);
            
        }

});
 }
 
//  vCard.saveToFile('./newContact3.vcf');
// var vCard = require('vcards-js');
 
//create a new vCard
// vCard = vCard();
 
//set properties
// vCard.firstName = 'Eric';
// vCard.middleName = 'J';
// vCard.lastName = 'Nesser';
// vCard.organization = 'ACME Corporation';
// vCard.photo.attachFromUrl('https://avatars2.githubusercontent.com/u/5659221?v=3&s=460', 'JPEG');
// vCard.workPhone = '312-555-1212';
// vCard.birthday = new Date('01-01-1985');
// vCard.title = 'Software Developer';
// vCard.url = 'https://github.com/enesser';
// vCard.note = 'Notes on Eric';
 
// //save to file
// vCard.saveToFile('./eric-nesser2.vcf');
 
//get as formatted string

 
        
 
//save to file

    