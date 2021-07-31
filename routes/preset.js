const express = require('express');
const db = require('../db');
const builder = require('../object-builder')
const app = express();
const router = express.Router();

// Returns all presets of a group
router.get('',function (req,res){
    // Expected Parameters
    //   req.query.group_id
    console.log("Starting preset retrieval...");
    console.log(req.query);
    db.getClient().then((client) =>{
        let query1 = 'SELECT po.group_id FROM part_of po WHERE po.group_id = $1 AND po.user_id = $2';
        let values1 = [req.query.group_id,req.userData.id];
        client.query(query1,values1).then((result1 => {
            if(result1.rowCount === 0){
                console.log("WARN: Insufficient rights/group not found.");
                client.release();
                return res.status(403).json({message: 'Group does not exist or is not accessible.'});
            }
            let query2 = 'SELECT pr.id,pr.name,pr.amount FROM preset pr WHERE pr.group_id = $1';
            let values2 = [req.query.group_id];
            client.query(query2,values2).then((result2) => {
                console.log("Preset retrieval successful.");
                client.release();
                return res.status(200).json(builder.buildPresets(result2.rows));
            }).catch((error) => {
                console.log("ERR: group_id parameter was valid, but is not anymore.");
                console.log(error);
                client.release();
                return res.status(500).json({ message: 'Group id parameter not valid.'});
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

// Creates a new preset for a group
router.post('',function (req,res){
    // Expected Parameters
    //   req.body.group_id
    //   req.body.name
    //   req.body.amount
    console.log("Starting preset creation...");
    console.log(req.body);
    db.getClient().then((client) =>{
        let query1 = 'SELECT po.group_id FROM part_of po WHERE po.group_id = $1 AND po.user_id = $2';
        let values1 = [req.body.group_id,req.userData.id];
        client.query(query1,values1).then((result1 => {
            if(result1.rowCount === 0){
                console.log("WARN: Insufficient rights/group not found.");
                client.release();
                return res.status(403).json({message: 'Group does not exist or is not accessible.'});
            }
            let query2 = 'INSERT INTO preset (group_id,name,amount) VALUES ($1,$2,$3) RETURNING id';
            let values2 = [req.body.group_id,req.body.name,req.body.amount];
            client.query(query2,values2).then((result2) => {
                console.log("Preset creation successful.");
                client.release();
                return res.status(200).json(builder.buildPresetRaw(result2.rows[0].id,req.body.name,req.body.amount));
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

// Changes preset amount & name
router.put('',function (req,res){
    // Expected Parameters
    //   req.body.id
    //   req.body.name
    //   req.body.amount
    console.log("Starting preset update...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'SELECT po.group_id FROM part_of po, preset pr WHERE pr.id = $1 AND po.group_id = pr.group_id AND po.user_id = $2';
        let values1 = [req.body.id,req.userData.id];
        client.query(query1,values1).then((result1) => {
            if (result1.rowCount === 0) {
                console.log("WARN: Insufficient rights/preset not found.");
                client.release();
                return res.status(403).json({message: 'Preset does not exist or is not accessible.'});
            }
            let query2 = 'UPDATE preset pr SET pr.name = $1, pr.amount = $2 WHERE pr.id = $3';
            let values2 = [req.body.name,req.body.amount,req.body.id];
            client.query(query2,values2).then((result2) =>{
                console.log("Preset update successful.")
                client.release();
                return res.status(200).json({message: 'Preset updated.'});
            }).catch((error)=> {
                console.log("ERR: A parameter was valid, but is not anymore.");
                console.log(error);
                client.release();
                return res.status(500).json({ message: 'Parameters not valid.'});
            });
        }).catch((error) => {
            console.log("WARN: Preset id parameter not valid.");
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Preset id parameter not valid.'});
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

// Deletes a preset
router.delete('',function (req,res){
    // Expected Parameters
    //   req.body.id
    console.log("Starting preset deletion...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'SELECT po.group_id FROM part_of po, preset pr WHERE pr.id = $1 AND po.group_id = pr.group_id AND po.user_id = $2';
        let values1 = [req.body.id,req.userData.id];
        client.query(query1,values1).then((result1) => {
            if(result1.rowCount === 0){
                console.log("WARN: Insufficient rights/preset not found.");
                client.release();
                return res.status(403).json({message: 'Preset does not exist or is not accessible.'});
            }
            let query2 = 'DELETE FROM preset pr WHERE pr.id = $1';
            let values2 = [req.body.id];
            client.query(query2,values2).then((result2) => {
                console.log("Preset deletion successful.");
                client.release();
                return res.status(200).json({message: 'Preset deleted.'});
            }).catch((error) => {
                console.log("ERR: preset_id parameter was valid, but is not anymore.");
                console.log(error);
                client.release();
                return res.status(500).json({ message: 'Preset id parameter not valid.'});
            });
        }).catch((error) => {
            console.log("WARN: Preset id parameter not valid.");
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Preset id parameter not valid.'});
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

module.exports = router;
