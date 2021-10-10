const Router = require("express");
const contactController = require("../controller/contact");
const router = Router();
require('dotenv').config();
const jwt = require("jsonwebtoken");

const authJwt= (req, res, next)=> {
    const header = req.header('Authorization');
    if(!header){
        console.log("Didn't Recieve Headers");
        return res.status(404).send({message:"You Need To Log in....."})
    }
    const token = header;
    console.log("Header RECIEVED - "+header);
    if (typeof(token) !== 'undefined') {
        try{
            
            let payload = jwt.verify(token, process.env.JWT_TOKEN);
            req.token = payload;
            next();
        }catch{
            console.log("Invalid Or Expired !");
           return res.status(401).send({ code: 123, message: 'Invalid or expired token.' });
        }
    } else {
        console.log("Token Not Recieved !");
       return res.status(403).send({message:"Token Not Recieved !"});
    }
}   

router.get("/getAllContact", authJwt,contactController.getAllContact);

router.post("/signup",contactController.newUser);

router.post("/signin", contactController.signin);

router.delete("/deleteContact/:id", authJwt, contactController.deleteContact);

router.post("/createContact", authJwt,  contactController.createContact );

router.get("/singleContact/:cid", authJwt, contactController.singleContact);

router.post("/update", authJwt, contactController.updateContact);

router.post("/checkpass", authJwt, contactController.checkPassword);

router.post("/changepass", authJwt, contactController.changePassword);

router.get("/downloadCsv", contactController.csvFile);

module.exports = router;