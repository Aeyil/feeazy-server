const db = require("../db");
const builder = require("../object-builder");
const express = require("express");
const app = express();
const router = express.Router();

// Adds a user to a group
router.post('', function(req,res){
    // Expected Parameters
    //   req.body.group_id
    //   req.body.email
    console.log("Starting user invite...");
    console.log(req.body);
    db.getClient().then(client => {
        let query1 = 'SELECT grp.leader_id FROM "group" grp WHERE grp.id = $1';
        let values1 = [req.body.group_id];
        client.query(query1,values1).then(result1 => {
            if(result1.rowCount === 0 || result1.rows[0].leader_id != req.userData.id){
                console.log("WARN: Insufficient rights/group not found.");
                client.release();
                return res.status(403).json({ message: 'Group does not exist or user is not leader of group.' });
            }
            let query2 = 'SELECT u.id,u.name FROM "user" u WHERE u.email = $1';
            let values2 = [req.body.email];
            client.query(query2,values2).then(result2 => {
                if(result2.rowCount === 0){
                    console.log("WARN: User does not exist.")
                    client.release();
                    return res.status(400).json({ message: 'User does not exist.'});
                }
                let query3 = 'INSERT INTO part_of (group_id,user_id) VALUES ($1,$2)';
                let values3 = [req.body.id,result2.rows[0].id];
                client.query(query3,values3).then(result4 => {
                    console.log("User invite successful.");
                    client.release();
                    return res.status(200).json(builder.buildUser(result2.rows[0]));
                }).catch((error) => {
                    console.log("WARN: User is already in group.");
                    console.log(error);
                    client.release();
                    return res.status(400).json({ message: 'User already in group.'});
                });
            }).catch((error) => {
                console.log("WARN: Email parameter not valid.");
                console.log(error);
                client.release();
                return res.status(400).json({message: 'Email parameter not valid.'});
            });
        }).catch((error) => {
            console.log("WARN: Group id parameter not valid.");
            console.log(error);
            client.release();
            return res.status(400).json({message: 'Group id parameter not valid.'});
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

module.exports = router;
