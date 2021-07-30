const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const cfg = require('../config.json');
const builder = require('../object-builder')
const app = express();
const router = express.Router();

router.post('', function(req,res){
    // Expected Parameters
    //   req.body.email
    //   req.body.name
    //   req.body.password
    console.log("Starting registration...");
    console.log(req.body);
    db.getClient()
        .then(client => {
            let query1 = 'SELECT u.id FROM "user" u WHERE u.email = $1';
            let values1 = [req.body.email];
            client.query(query1,values1)
                .then(result => {
                    if(result.rowCount > 0){
                        console.log("WARN: Email in use.");
                        client.release();
                        return res.status(400).json({ message: ' Email is already in use.' });
                    }
                    const saltRounds = 10;
                    bcrypt.genSalt(saltRounds, function(err,salt){
                        if(err){
                            console.log("ERR: Salt could not be generated.");
                            console.log(err);
                            client.release();
                            return res.status(500).json({ message: 'Password Salt could not be generated' });
                        }
                        bcrypt.hash(req.body.password,salt, function(err,hash){
                            if(err){
                                console.log("ERR: Hash could not be generated.");
                                console.log(err);
                                client.release();
                                return res.status(500).json({ message: 'Password Hash could not be created.' });
                            }
                            let query2 = 'INSERT INTO "user" (email,name,password,salt) VALUES ($1,$2,$3,$4) RETURNING id';
                            let values2 = [req.body.email,req.body.name,hash,salt];
                            client.query(query2,values2)
                                .then(result => {
                                    console.log("Registration successful.")
                                    client.release();
                                    let token = jwt.sign({id: result.rows[0].id}, cfg.auth.token, {expiresIn: cfg.auth.expiration});
                                    return res.status(201).json(builder.buildUserLoggedIn(result.rows[0].id,req.body.name,token));
                                })
                                .catch(error => {
                                    console.log("WARN: Email now in use. (race condition)");
                                    console.log(error);
                                    client.release();
                                    return res.status(500).json({ message: 'Email is now taken.' });
                                });
                        });
                    });
                })
                .catch((error) => {
                    console.log("WARN: email parameter not valid.");
                    console.log(error);
                    client.release();
                    return res.status(400).json({ message: 'Email parameter was not valid.'});
                });
        })
        .catch((error) => {
            console.log("ERR: Couldn't checkout db client.");
            console.log(error);
            return res.status(503).json({ message: 'Database connection currently not available.' });
        });
});

module.exports = router;
