const bcrypt = require("bcrypt");
  const sql = require("../config/dbconfig");
  const express = require("express");
  const router = express.Router();
  const jwt = require("jsonwebtoken");
  require('dotenv').config();  

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
    (name, mobile, email, address, isdelete, image, createdAt, createdBy) 
    VALUES  
    ( ?, ?, ?, ?, ?, ?, ?, ?)`;
    const queryOptions = [contact.firstname, contact.mobile, contact.email, contact.address, contact.isdeleted, contact.image, new Date(), contact.createdBy];
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


exports.newUser = async(req,res)=>{
    console.log("Sign Up Hits");
    const user = req.body;

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
    const query = `update pq_addcontact set name ='${contact.firstname}', mobile = ${contact.mobile}, email = '${contact.email}', address = '${contact.address}' where id = ${contact.id}`;

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