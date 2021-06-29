const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const app = express();
const router = express.Router();

// TODO
/* work in progress
router.post('', function(req,res){
    // Expected Parameters
    //   req.body.email
    //   req.body.name
    //   req.body.password
    const client = db.getClient();
    let query1 = 'SELECT id FROM user WHERE email = $1';
    let values1 = [req.body.email];
    client.query()
        .then(result => {
            if(result.rowCount === 0){

            }
            else{
                client.release()
            }
        })
        .catch(error => {

        })

    const saltRounds = 10;
    bcrypt.genSalt(saltRounds, function(err,salt){
        if(err){
            return res.status(500).json({ message: 'Password Salt could not be generated' });
        }
        bcrypt.hash(req.body.password,salt, function(err,hash){
            if(err){
                return res.status(500).json({ message: 'Password Hash could not be created.' });
            }
            let query2 = 'INSERT INTO user (email,name,password,salt) VALUES ($1,$2,$3,$4) RETURNING id';
            let values2 = [req.body.email,req.body.name,hash,salt];
            client.query(query2,values2)
                .then(result => {

                })
                .catch(error => {
                    return res.status(500).json({ message: 'E-Mail is already taken.' });
                });
        });
    });
});
*/
module.exports = router;
