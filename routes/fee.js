const express = require('express');
const db = require('../db');
const builder = require("../object-builder");
const app = express();
const router = express.Router();

// Returns all fees of a single group
router.get('',function (req,res,next){
    // Expected Parameters
    //   req.query.group_id
    if(!req.query.hasOwnProperty('group_id')){
        return next();
    }
    console.log("Starting fee retrieval (group)...");
    console.log(req.query);
    db.getClient().then((client) =>{
        let query1 = 'SELECT * FROM part_of po WHERE po.group_id = $1 AND po.user_id = $2';
        let values1 = [req.query.group_id,req.userData.id];
        client.query(query1,values1).then((result1 => {
            if(result1.rowCount === 0){
                console.log("WARN: Insufficient rights/group not found.");
                client.release();
                return res.status(403).json({message: 'Group does not exist or is not accessible.'});
            }
            let query2 = 'SELECT fe.* FROM fee fe WHERE fe.group_id = $1';
            let values2 = [req.query.group_id];
            client.query(query2,values2).then((result2) => {
                console.log("Fee retrieval (group) successful.");
                client.release();
                return res.status(200).json(builder.buildFees(result2.rows));
            }).catch((error) => {
                console.log("ERR: Group id parameter was valid, but is not anymore.");
                console.log(error);
                client.release();
                return res.status(500).json({ message: 'Group id parameter not valid.'});
            })
        })).catch((error) => {
            console.log("WARN: group_id parameter not valid.");
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Group id parameter not valid.'});
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

// Returns all fees of a single user
router.get('',function (req,res){
    // Expected Parameters
    //   - none
    console.log("Starting fee retrieval (user)...");
    console.log(req.query);
    db.getClient().then((client) =>{
        let query1 = 'SELECT fe.* FROM fee fe WHERE fe.user_id = $1';
        let values1 = [req.userData.id];
        client.query(query1,values1).then((result1) => {
            console.log("Fee retrieval (user) successful.");
            client.release();
            return res.status(200).json(builder.buildFees(result1.rows));
        }).catch((error) => {
            console.log("ERR: Could not retrieve fee list for user.");
            console.log(error);
            client.release();
            return res.status(500).json({message: 'Could not retrieve fee list for user.'});
        })
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

// Creates a new fee for a user in a group
router.post('',function (req,res){
    // Expected Parameters
    //   req.body.group_id
    //   req.body.user_id
    //   req.body.name
    //   req.body.amount
    console.log("Starting fee creation...");
    console.log(req.body);
    db.getClient().then((client) =>{
        let query1 = 'SELECT * FROM part_of po WHERE po.group_id = $1 AND po.user_id = $2';
        let values1 = [req.body.group_id,req.userData.id];
        client.query(query1,values1).then((result1 => {
            if(result1.rowCount === 0){
                console.log("WARN: Insufficient rights/group not found.");
                client.release();
                return res.status(403).json({message: 'Group does not exist or is not accessible.'});
            }
            let query2 = 'INSERT INTO fee (group_id,user_id,name,amount) VALUES ($1,$2,$3,$4) RETURNING id';
            let values2 = [req.body.group_id,req.body.user_id,req.body.name,req.body.amount];
            client.query(query2,values2).then((result2) => {
                console.log("Fee creation successful.");
                client.release();
                return res.status(200).json(builder.buildFeeRaw(result2.rows[0].id,req.body.user_id,req.body.name,req.body.amount));
            }).catch((error) => {
                console.log("ERR: A parameter was valid, but is not anymore.");
                console.log(error);
                client.release();
                return res.status(500).json({ message: 'Parameters not valid.'});
            });
        })).catch((error) => {
            console.log("WARN: group_id parameter not valid.");
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Group id parameter not valid.'});
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

// Changes the status of a fee
router.put('',function (req,res){
    // Expected Parameters
    //   req.body.id
    //   req.body.status
    console.log("Starting fee update...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'SELECT * FROM part_of po, fee fe WHERE fe.id = $1 AND po.group_id = fe.group_id AND po.user_id = $2';
        let values1 = [req.body.id,req.userData.id];
        client.query(query1,values1).then((result1) => {
            if(result1.rowCount === 0){
                console.log("WARN: Insufficient rights/fee not found.");
                client.release();
                return res.status(403).json({message: 'Fee does not exist or is not accessible.'});
            }
            let query2 = 'UPDATE fee fe SET status = $1 WHERE fe.id = $2';
            let values2 = [req.body.status,req.body.id];
            client.query(query2,values2).then((result2) =>{
                console.log("Fee update successful.")
                client.release();
                return res.status(200).json({message: 'Fee updated.'});
            }).catch((error)=> {
                console.log("ERR: A parameter was valid, but is not anymore.");
                console.log(error);
                client.release();
                return res.status(500).json({ message: 'Parameters not valid.'});
            });
        }).catch((error) => {
            console.log("WARN: Fee id parameter not valid.");
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Fee id parameter not valid.'});
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

// Deletes a fee
router.delete('',function (req,res){
    // Expected Parameters
    //   req.body.id
    console.log("Starting fee deletion...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'SELECT * FROM part_of po, fee fe WHERE fe.id = $1 AND po.group_id = fe.group_id AND po.user_id = $2';
        let values1 = [req.body.id,req.userData.id];
        client.query(query1,values1).then((result1) => {
            if(result1.rowCount === 0){
                console.log("WARN: Insufficient rights/fee not found.");
                client.release();
                return res.status(403).json({message: 'Fee does not exist or is not accessible.'});
            }
            let query2 = 'DELETE FROM fee fe WHERE fe.id = $1';
            let values2 = [req.body.id];
            client.query(query2,values2).then((result2) => {
                console.log("Fee deletion successful.");
                client.release();
                return res.status(200).json({message: 'Fee deleted.'});
            }).catch((error) => {
                console.log("ERR: Fee id parameter was valid, but is not anymore.");
                console.log(error);
                client.release();
                return res.status(500).json({ message: 'Fee id parameter not valid.'});
            });
        }).catch((error) => {
            console.log("WARN: Fee id parameter not valid.");
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Fee id parameter not valid.'});
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

module.exports = router;
