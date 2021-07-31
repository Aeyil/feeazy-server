const express = require('express');
const db = require('../db');
const builder = require("../object-builder");
const app = express();
const router = express.Router();

// Returns all users of a given group
router.get('',function(req,res,next){
    // Expected Parameters
    //   req.body.group_id
    console.log(req.query);
    if(req.query.hasOwnProperty("group_id")){
        return next();
    }
    console.log("Starting user retrieval (group)...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'SELECT * FROM part_of po WHERE po.group_id = $1 AND po.user_id = $2';
        let values1 = [req.body.group_id,req.userData.id];
        client.query(query1,values1).then((result1) => {
            if (result1.rowCount === 0) {
                console.log("WARN: Insufficient rights/group not found.");
                client.release();
                return res.status(403).json({message: 'Group does not exist or is not accessible.'});
            }
            let query2 = 'SELECT u.id,u.name FROM "user" u, part_of po WHERE po.group_id = $1 AND po.user_id = u.id';
            let values2 = [req.body.group_id];
            client.query(query2,values2).then((result2) => {
                console.log("User retrieval (group) successful.")
                client.release();
                return res.status(200).json(builder.buildUsers(result2.rows));
            }).catch((error) => {
                console.log("ERR: Group id parameter was valid, but is not anymore.");
                console.log(error);
                client.release();
                return res.status(500).json({ message: 'Group id parameter not valid.'});
            });
        }).catch((error) => {
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

// Returns a user
router.get('',function(req,res){
    // Expected Parameters
    //   req.body.id
    console.log("Starting user retrieval (single)...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'SELECT u.id, u.name FROM "user" u WHERE u.id = $1';
        let values1 = [req.body.id];
        client.query(query1,values1).then((result1) => {
            if(result1.rowCount === 0){
                console.log("WARN: User not found.");
                client.release();
                return res.status(404).json({message: 'User could not be found.'});
            }
            console.log("User retrieval (single) successful.");
            client.release();
            return res.status(200).json(builder.buildUser(result1.rows[0]));
        }).catch((error) => {
            console.log("ERR: Could not retrieve user information.");
            console.log(error);
            client.release();
            return res.status(500).json({ message: 'Could not retrieve user information.' });
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

router.put('',function(req,res){
    // Expected Parameters
    //   req.body.name
    console.log("Starting user update...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'UPDATE "user" u SET name = $1 WHERE u.id = $2';
        let values1 = [req.body.name,req.userData.id];
        client.query(query1,values1).then((result1) => {
            console.log("User update successful.");
            client.release();
            return res.status(200).json({message: 'User updated.'});
        }).catch((error) => {
            console.log("WARN: name parameter not valid.");
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Name parameter not valid.'});
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

router.delete('',function(req,res){
    // Expected Parameters
    //   - none
    console.log("Starting user deletion...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'SELECT grp.id FROM "group" grp WHERE grp.leader_id = $1';
        let values1 = [req.userData.id];
        client.query(query1,values1).then((result1) => {
            if(result1.rowCount > 0){
                console.log("WARN: User is leader of a group.")
                client.release();
                return res.status(400).json({message: 'User cannot be deleted, because he is leader of a group.'});
            }
            client.query('BEGIN').then(() => {
                console.log("Transaction started.")
                let query2 = 'DELETE FROM fee fe WHERE fe.user_id = $1';
                let values2 = [req.userData.id];
                client.query(query2,values2).then((result2) => {
                    let query3 = 'DELETE FROM part_of po WHERE po.user_id = $1';
                    let values3 = [req.userData.id];
                    client.query(query3,values3).then((result3) => {
                        let query4 = 'DELETE FROM "user" u WHERE u.id = $1';
                        let values4 = [req.userData.id];
                        client.query(query4,values4).then((result4) => {
                            client.query('COMMIT').then(() => {
                                console.log("Transaction committed.");
                                console.log("User deletion successful.");
                                client.release();
                                return res.status(200).json({message: 'User has been deleted.'});
                            }).catch((error) => {
                                console.log("ERR: Could not commit transaction.");
                                console.log(error);
                                client.query('ABORT').then(() => {
                                    console.log("Transaction aborted.")
                                    client.release();
                                    return res.status(500).json({message: 'User could not be deleted.'});
                                }).catch((error) => {
                                    console.log("ERR: Could not abort transaction.");
                                    console.log(error);
                                    client.release();
                                    return res.status(500).json({message: 'User could not be deleted.'});
                                });
                            });
                        }).catch((error) => {
                            console.log("ERR: Could not delete user.");
                            console.log(error);
                            client.query('ABORT').then(() => {
                                console.log("Transaction aborted.")
                                client.release();
                                return res.status(500).json({message: 'User could not be deleted.'});
                            }).catch((error) => {
                                console.log("ERR: Could not abort transaction.");
                                console.log(error);
                                client.release();
                                return res.status(500).json({message: 'User could not be deleted.'});
                            });
                        });
                    }).catch((error) => {
                        console.log("ERR: Could not delete group membership of user.");
                        console.log(error);
                        client.query('ABORT').then(() => {
                            console.log("Transaction aborted.")
                            client.release();
                            return res.status(500).json({message: 'User could not be deleted.'});
                        }).catch((error) => {
                            console.log("ERR: Could not abort transaction.");
                            console.log(error);
                            client.release();
                            return res.status(500).json({message: 'User could not be deleted.'});
                        });
                    });
                }).catch((error) => {
                    console.log("ERR: Could not delete fees of user.");
                    console.log(error);
                    client.query('ABORT').then(() => {
                        console.log("Transaction aborted.")
                        client.release();
                        return res.status(500).json({message: 'User could not be deleted.'});
                    }).catch((error) => {
                        console.log("ERR: Could not abort transaction.");
                        console.log(error);
                        client.release();
                        return res.status(500).json({message: 'User could not be deleted.'});
                    });
                });
            }).catch((error) => {
                console.log("ERR: Could not begin transaction.")
                console.log(error);
                client.release();
                return res.status(500).json({message: 'User could not be deleted.'});
            });
        }).catch((error) => {
            console.log("ERR: User leadership query failed.");
            console.log(error);
            client.release();
            return res.status(500).json({ message: 'User could not be deleted.' });
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});


module.exports = router;
