const express = require('express');
const db = require('../db');
const builder = require('../object-builder');
const app = express();
const router = express.Router();

router.get('', function(req,res){
    // Expected Parameters
    //   req.body.id (optional)
    db.getClient
        .then(client => {
            if('id' in req.body){ // TODO: working?
                let query1 = 'SELECT * FROM part_of WHERE group_id = $1 AND user_id = $2';
                let values1 = [req.body.id,req.userData.id];
                client.query(query1,values1)
                    .then(result1 => {
                        if(result1.rowCount === 0){
                            client.release();
                            return res.status(403).json({ message: 'Group cannot be accessed by this user.'});
                        }
                        let query2 = 'SELECT * FROM "group" WHERE id = $1';
                        let values2 = [req.body.id];
                        client.query(query2,values2)
                            .then(result2 => {
                                client.release();
                                return res.status(200).json(builder.buildGroup(result2.rows[0]));
                            })
                            .catch(() => {
                                client.release();
                                return res.status(500).json({ message: 'Group parameter not valid.' });
                            });
                    })
                    .catch(() => {
                        client.release();
                        return res.status(400).json({ message: 'Group parameter not valid.' });
                    });
            }
            else{
                let query1 = 'SELECT grp.* FROM "group" grp, part_of po WHERE po.user_id = $1 AND po.group_id = grp.id';
                let values1 = [req.userData.id];
                client.query(query1,values1)
                    .then(result => {
                        client.release();
                        let groups = [];
                        for(let row of result.rows){
                            groups.push(builder.buildGroup(row));
                        }
                        return res.status(200).json(groups);
                    })
                    .catch(() => {
                        client.release();
                        return res.status(400).json({ message: 'Groups for user could not be retrieved.' });
                    });
            }
        })
        .catch(() => {
            return res.status(503).json({ message: 'Database connection currently not available.' });
        });

});

router.post('', function(req,res){
    // TODO: THIS SHOULD BE A TRANSACTION
    // Expected Parameters
    //   req.body.id (optional)
    //   req.body.leader_id (optional)
    //   req.body.name
    db.getClient
        .then(client => {
            if('id' in req.body){ // TODO: working?
                let query1 = 'SELECT grp.leader_id FROM "group" grp WHERE grp.id = $1';
                let values1 = [req.body.id];
                client.query(query1,values1)
                    .then(result1 => {
                        if(result1.rows[0].leader_id !== req.userData.id){
                            client.release();
                            return res.status(403).json({ message: 'Group cannot be altered by this user.' });
                        }
                        let query2 = 'SELECT * FROM part_of po WHERE po.group_id = $1 AND po.user_id = $2';
                        let values2 = [req.body.id,req.body.leader_id];
                        client.query(query2,values2)
                            .then(result2 => {
                                if(result2.rowCount === 0){
                                    client.release();
                                    return res.status(400).json({ message: 'New leader must be part of group.' });
                                }
                                let query3 = 'UPDATE "group" SET leader_id = $1, name = $2, last_changed = CURRENT_TIMESTAMP WHERE id = $3';
                                let values3 = [req.body.leader_id,req.body.name,req.body.id];
                                client.query(query3,values3)
                                    .then(result3 => {
                                        let query4 = 'SELECT * FROM "group" grp WHERE grp.id = $1';
                                        let values4 = [req.body.id];
                                        client.query(query4, values4)
                                            .then(result4 => {
                                                client.release();
                                                return res.status(200).json(builder.buildGroup(result4.rows[0]));
                                            })
                                            .catch(() => {
                                                client.release();
                                                return res.status(500).json({message: 'Couldn\'t retrieve group.'});
                                            });
                                    })
                                    .catch(() => {
                                        client.release();
                                        return res.status(400).json({message: 'Group name or leader parameter not valid.'});
                                    });
                            })
                            .catch(() => {
                                client.release();
                                return res.status(400).json({message: 'Group or leader parameter not valid.'});
                            });
                    })
                    .catch(() => {
                        client.release();
                        return res.status(400).json({message: 'Group parameter not valid.'});
                    });
            }
            else{
                let query1 = 'INSERT INTO "group" (leader_id,last_changed,name) VALUES ($1,CURRENT_TIMESTAMP,$2) RETURNING id';
                let values1 = [req.userData.id, req.body.name];
                client.query(query1, values1)
                    .then(result1 => {
                        let query2 = 'INSERT INTO part_of (group_id,user_id) VALUES ($1,$2)';
                        let values2 = [result1.rows[0].id, req.userData.id];
                        client.query(query2, values2)
                            .then(result2 => {
                                let query3 = 'SELECT * FROM "group" grp WHERE grp.id = $1';
                                let values3 = [result1.rows[0].id];
                                client.query(query3, values3)
                                    .then(result3 => {
                                        client.release();
                                        return res.status(200).json(builder.buildGroup(result3.rows[0]));
                                    })
                                    .catch(() => {
                                        client.release();
                                        return res.status(500).json({message: 'Couldn\'t retrieve group.'});
                                    });
                            })
                            .catch(() => {
                                client.release();
                                return res.status(500).json({message: 'Couldn\'t add user to member list.'});
                            });
                    })
                    .catch(() => {
                        client.release();
                        return res.status(400).json({message: 'Group name parameter not valid.'});
                    });
            }
        })
        .catch(() => {
            return res.status(503).json({ message: 'Database connection currently not available.' });
        });
});

// TODO: move to members route
router.put('', function(req,res){
    // Expected Parameters
    //   req.body.id
    //   req.body.email
    db.getClient
        .then(client => {
            let query1 = 'SELECT grp.leader_id FROM "group" grp WHERE grp.id = $1';
            let values1 = [req.body.id];
            client.query(query1,values1)
                .then(result1 => {
                    if(result1.rows[0].leader_id !== req.userData.id){
                        client.release();
                        return res.status(403).json({ message: 'Must be leader of group to add members.' });
                    }
                    let query2 = 'SELECT u.id,u.name FROM "user" u WHERE u.email = $1';
                    let values2 = [req.body.email];
                    client.query(query2,values2)
                        .then(result2 => {
                            if(result2.rowCount === 0){
                                client.release();
                                return res.status(400).json({ message: 'User does not exist.'});
                            }
                            let query3 = 'INSERT INTO part_of (group_id,user_id) VALUES ($1,$2)';
                            let values3 = [req.body.id,result2.rows[0].id];
                            client.query(query3,values3)
                                .then(result4 => {
                                    client.release()
                                    return res.status(200).json(builder.buildMember(result2.rows[0]));
                                })
                                .catch(() => {
                                    client.release();
                                    return res.status(400).json({ message: 'User already in group.'});
                                });
                        })
                        .catch(() => {
                            client.release();
                            return res.status(400).json({message: 'Email parameter not valid.'});
                        });
                })
                .catch(() => {
                    client.release();
                    return res.status(400).json({message: 'Group parameter not valid.'});
                });
        })
        .catch(() => {
            return res.status(503).json({ message: 'Database connection currently not available.' });
        });
});


router.delete('', function(req,res){
    // TODO: THIS SHOULD BE A TRANSACTION
    // Expected Parameters
    //   req.body.id
    db.getClient
        .then(client => {
            let query1 = 'SELECT grp.leader_id FROM "group" grp WHERE grp.id = $1';
            let values1 = [req.body.id];
            client.query(query1,values1)
                .then(result1 => {
                    if(result1.rows[0].leader_id !== req.userData.id){
                        client.release();
                        return res.status(403).json({ message: 'Must be leader of group to add members.' });
                    }
                    let query2 = 'DELETE FROM fee WHERE group_id = $1';
                    let values2 = [req.body.id];
                    client.query(query2,values2)
                        .then(() =>{
                            let query3 = 'DELETE FROM part_of WHERE group_id = $1';
                            let values3 = [req.body.id];
                            client.query(query3, values3)
                                .then(() => {
                                    let query4 = 'DELETE FROM preset WHERE group_id = $1';
                                    let values4 = [req.body.id];
                                    client.query(query4,values4)
                                        .then(() => {
                                            let query5 = 'DELETE FROM "group" WHERE id = $1';
                                            let values5 = [req.body.id];
                                            client.query(query5,values5)
                                                .then(() => {
                                                    client.release();
                                                    return res.status(200).json({});
                                                })
                                                .catch(() => {
                                                    client.release();
                                                    return res.status(400).json({message: 'Couldn\'t delete group.'});
                                                });
                                        })
                                        .catch(() => {
                                            client.release();
                                            return res.status(500).json({message: 'Couldn\'t delete presets.'});
                                        });
                                })
                                .catch(() => {
                                    client.release();
                                    return res.status(500).json({message: 'Couldn\'t delete members.'});
                                });
                        })
                        .catch(() =>{
                            client.release();
                            return res.status(500).json({message: 'Couldn\'t delete fees.'});
                        });
                })
                .catch(() => {
                    client.release();
                    return res.status(400).json({message: 'Group parameter not valid.'});
                });
        })
        .catch(() => {
            return res.status(503).json({ message: 'Database connection currently not available.' });
        });
});

module.exports = router;
