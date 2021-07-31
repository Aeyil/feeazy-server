const express = require('express');
const db = require('../db');
const builder = require('../object-builder');
const app = express();
const router = express.Router();

// Returns a single group to a user
router.get('', function(req,res,next){
    // Expected Parameters
    //   req.query.id
    if(!req.query.hasOwnProperty("id")){
        return next();
    }
    console.log("Starting group retrieval (single)...")
    db.getClient().then(client => {
        let query1 = 'SELECT grp.* FROM part_of po,"group" grp WHERE po.group_id = $1 AND po.user_id = $2 AND po.group_id = grp.id';
        let values1 = [req.query.id,req.userData.id];
        client.query(query1,values1).then(result1 => {
            if(result1.rowCount === 0){
                console.log("WARN: Insufficient rights/group not found.");
                client.release();
                return res.status(403).json({message: 'Group does not exist or is not accessible.'});
            }
            console.log("Group retrieval (single) successful.")
            client.release();
            return res.status(200).json(builder.buildGroup(result1.rows[0]));
        }).catch((error) => {
            console.log("WARN: Group parameter not valid.")
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Group parameter not valid.' });
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

// Returns all groups of a single user
router.get('', function(req,res){
    // Expected Parameters
    //   - none
    console.log("Starting group retrieval (all)...");
    console.log(req.query);
    db.getClient().then((client) => {
        let query1 = 'SELECT grp.* FROM "group" grp, part_of po WHERE po.user_id = $1 AND po.group_id = grp.id';
        let values1 = [req.userData.id];
        client.query(query1,values1).then(result1 => {
            console.log("Group retrieval (all) successful.")
            client.release();
            return res.status(200).json(builder.buildGroups(result1.rows));
        }).catch((error) => {
            console.log("ERR: Couldn't retrieve groups for user.")
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Groups for user could not be retrieved.' });
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

// Creates a new group
router.post('',function(req,res){
    // Expected Parameters
    //   req.body.name
    console.log("Starting group creation...")
    db.getClient().then((client) => {
        client.query('BEGIN').then(() => {
            let query1 = 'INSERT INTO "group" (leader_id,last_changed,name) VALUES ($1,CURRENT_TIMESTAMP,$2) RETURNING id';
            let values1 = [req.userData.id,req.body.name];
            client.query(query1,values1).then((result1) => {
                let query2 = 'INSERT INTO part_of (group_id,user_id) VALUES ($1,$2)';
                let values2 = [result1.rows[0].id,req.userData.id];
                client.query(query2,values2).then((result2) => {
                    client.query('COMMIT').then((result3) => {
                        console.log("Transaction committed.");
                        console.log("Group creation successful.");
                        client.release();
                        return res.status(200).json(builder.buildGroupRaw(result1.rows[0].id,req.userData.id,req.body.name));
                    }).catch((error) => {
                        console.log("ERR: Could not commit transaction.");
                        console.log(error);
                        client.query('ABORT').then(() => {
                            console.log("Transaction aborted.")
                            client.release();
                            return res.status(500).json({message: 'Group could not be created.'})
                        }).catch((error) => {
                            console.log("ERR: Could not abort transaction.");
                            console.log(error);
                            client.release();
                            return res.status(500).json({message: 'Group could not be created.'})
                        });
                    });
                }).catch((error) => {
                    console.log("ERR: Could not create group leader membership.");
                    console.log(error);
                    client.query('ABORT').then(() => {
                        console.log("Transaction aborted.")
                        client.release();
                        return res.status(500).json({message: 'Group could not be created.'})
                    }).catch((error) => {
                        console.log("ERR: Could not abort transaction.");
                        console.log(error);
                        client.release();
                        return res.status(500).json({message: 'Group could not be created.'})
                    });
                });
            }).catch((error) => {
                console.log("ERR: Could not create group.");
                console.log(error);
                client.query('ABORT').then(() => {
                    console.log("Transaction aborted.")
                    client.release();
                    return res.status(500).json({message: 'Group could not be created.'})
                }).catch((error) => {
                    console.log("ERR: Could not abort transaction.");
                    console.log(error);
                    client.release();
                    return res.status(500).json({message: 'Group could not be created.'})
                });
            });
        }).catch((error) => {
            console.log("ERR: Could not begin transaction.")
            console.log(error);
            client.release();
            return res.status(500).json({message: 'Group could not be created.'})
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

// Updates an existing group
router.put('',function(req,res){
    // Expected Parameters
    //   req.body.id
    //   req.body.leader_id
    //   req.body.name
    console.log("Starting group update...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'SELECT grp.leader_id FROM "group" grp WHERE grp.id = $1';
        let values1 = [req.body.id];
        client.query(query1,values1).then((result1) => {
            if(result1.rowCount === 0 || result1.rows[0].leader_id !== req.userData.id){
                console.log("WARN: Insufficient rights/group not found.");
                client.release();
                return res.status(403).json({message: 'Group does not exist or cannot be altered by user.'});
            }
            let query2 = 'SELECT * FROM part_of po WHERE po.group_id = $1 AND po.user_id = $2';
            let values2 = [req.body.id,req.body.leader_id];
            client.query(query2,values2).then((result2) => {
                if(result2.rowCount === 0){
                    console.log("WARN: New leader has to be in group.");
                    client.release();
                    return res.status(403).json({message: 'New group leader must be member of group.'});
                }
                let query3 = 'UPDATE "group" grp SET leader_id = $1, name = $2 WHERE grp.id = $3';
                let values3 = [req.body.leader_id, req.body.name, req.body.id];
                client.query(query3,values3).then((result3) => {
                    console.log("Group update successful.");
                    client.release();
                    return res.status(200).json({message: 'Group has been updated.'});
                }).catch((error) => {
                    console.log("WARN: Parameters are not valid.")
                    console.log(error);
                    client.release();
                    return res.status(400).json({message: 'Parameters not valid.'})
                });
            }).catch((error) => {
                console.log("WARN: Group id or leader id parameter is not valid.")
                console.log(error);
                client.release();
                return res.status(400).json({message: 'Parameters not valid.'})
            });
        }).catch((error) => {
            console.log("WARN: Group id parameter is not valid.")
            console.log(error);
            client.release();
            return res.status(400).json({message: 'Group id is not valid.'})
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

// Deletes a group
router.delete('',function(req,res){
    // Expected Parameters
    //   req.body.id
    console.log("Starting group deletion...");
    console.log(req.body);
    db.getClient().then((client) => {
        let query1 = 'SELECT grp.leader_id FROM "group" grp WHERE grp.id = $1';
        let values1 = [req.body.id];
        client.query(query1,values1).then((result1) => {
            if(result1.rowCount === 0 || result1.rows[0].leader_id !== req.userData.id){
                console.log("WARN: Insufficient rights/group not found.")
                client.release();
                return res.status(403).json({message: 'Group does not exist or cannot deleted by this user.'});
            }
            client.query('BEGIN').then(() => {
                let query2 = 'DELETE FROM preset pr WHERE pr.group_id = $1';
                let values2 = [req.body.id];
                client.query(query2,values2).then((result2) => {
                    let query3 = 'DELETE FROM fee fe WHERE fe.group_id = $1';
                    let values3 = [req.body.id];
                    client.query(query3,values3).then((result3) => {
                        let query4 = 'DELETE FROM part_of po WHERE po.group_id = $1';
                        let values4 = [req.body.id];
                        client.query(query4,values4).then((result4) => {
                            let query5 = 'DELETE FROM "group" grp WHERE grp.id = $1';
                            let values5 = [req.body.id];
                            client.query(query5,values5).then((result5) => {
                                client.query('COMMIT').then(() => {
                                    console.log("Transaction committed.");
                                    console.log("Group deletion successful.");
                                    client.release();
                                    return res.status(200).json({message: 'Group has been deleted.'});
                                }).catch((error) => {
                                    console.log("ERR: Could not commit transaction.");
                                    console.log(error);
                                    client.query('ABORT').then(() => {
                                        console.log("Transaction aborted.")
                                        client.release();
                                        return res.status(500).json({message: 'Group could not be deleted.'})
                                    }).catch((error) => {
                                        console.log("ERR: Could not abort transaction.");
                                        console.log(error);
                                        client.release();
                                        return res.status(500).json({message: 'Group could not be deleted.'})
                                    });
                                });
                            }).catch((error) => {
                                console.log("ERR: Could not delete group.");
                                console.log(error);
                                client.query('ABORT').then(() => {
                                    console.log("Transaction aborted.")
                                    client.release();
                                    return res.status(500).json({message: 'Group could not be deleted.'})
                                }).catch((error) => {
                                    console.log("ERR: Could not abort transaction.");
                                    console.log(error);
                                    client.release();
                                    return res.status(500).json({message: 'Group could not be deleted.'})
                                });
                            });
                        }).catch((error) => {
                            console.log("ERR: Could not delete group member.");
                            console.log(error);
                            client.query('ABORT').then(() => {
                                console.log("Transaction aborted.")
                                client.release();
                                return res.status(500).json({message: 'Group could not be deleted.'})
                            }).catch((error) => {
                                console.log("ERR: Could not abort transaction.");
                                console.log(error);
                                client.release();
                                return res.status(500).json({message: 'Group could not be deleted.'})
                            });
                        });
                    }).catch((error) => {
                        console.log("ERR: Could not delete group fees.");
                        console.log(error);
                        client.query('ABORT').then(() => {
                            console.log("Transaction aborted.")
                            client.release();
                            return res.status(500).json({message: 'Group could not be deleted.'})
                        }).catch((error) => {
                            console.log("ERR: Could not abort transaction.");
                            console.log(error);
                            client.release();
                            return res.status(500).json({message: 'Group could not be deleted.'})
                        });
                    });
                }).catch((error) => {
                    console.log("ERR: Could not delete group presets.");
                    console.log(error);
                    client.query('ABORT').then(() => {
                        console.log("Transaction aborted.")
                        client.release();
                        return res.status(500).json({message: 'Group could not be deleted.'})
                    }).catch((error) => {
                        console.log("ERR: Could not abort transaction.");
                        console.log(error);
                        client.release();
                        return res.status(500).json({message: 'Group could not be deleted.'})
                    });
                });
            }).catch((error) => {
                console.log("ERR: Could not begin transaction.")
                console.log(error);
                client.release();
                return res.status(500).json({message: 'Group could not be deleted.'})
            });
        }).catch((error) => {
            console.log("WARN: Group id parameter not valid.");
            console.log(error);
            client.release();
            return res.status(400).json({ message: 'Group id parameter not valid.' });
        });
    }).catch((error) => {
        console.log("ERR: Couldn't checkout db client.");
        console.log(error);
        return res.status(503).json({ message: 'Database connection currently not available.' });
    });
});

module.exports = router;
