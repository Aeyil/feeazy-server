const express = require('express');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const db = require('../db');
const cfg = require('../config.json');
const builder = require('../object-builder');
const app = express();
const router = express.Router();

router.post('', function(req,res){
    // Expected Parameters
    //   req.body.email
    //   req.body.password
   db.getClient
       .then(client => {
           let query = 'SELECT u.id, u.email, u.password FROM "user" u WHERE u.email = $1';
           let values = [req.body.email];
           client.query(query,values)
               .then(result => {
                   if(result.rowCount === 0){
                       client.release();
                       return res.status(400).json({ message: 'Email and/or Password not valid.'});
                   }
                   bcrypt.compare(req.body.password, result.rows[0].password, function (err, bres){
                       client.release();
                       if(bres){
                           let token = jwt.sign({id: result.rows[0].id}, cfg.auth.token, {expiresIn: cfg.auth.expiration});
                           return res.status(200).json(builder.buildUserLoggedIn(result.rows[0].id,req.body.name,token));
                       }
                       else{
                           return res.status(400).json({ message: 'Email and/or Password not valid.'});
                       }
                   });
               })
               .catch(() => {
                   client.release();
                   return res.status(500).json({ message: 'Email parameter was not valid.'});
               })
       })
       .catch(() => {
           return res.status(503).json({ message: 'Database connection currently not available.' });
       })
});

module.exports = router;
