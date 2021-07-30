const express = require('express');
const db = require('../db');
const app = express();
const router = express.Router();

// TODO
router.get('',function (req,res){
    // Expected Parameters
    //   req.body.group_id
    console.log("Starting preset retrieval...");
    console.log(req.body);
    db.getClient()
        .then((client) =>{
            console.log("TEST1");
            return "Hello";
        },(error) => {
            console.log("TESTERR");
            return res.status(404).json();
        })
        .then(result => {
            console.log("TEST2");
            console.log(result);
            return res.status(200).json({ message: "part2 complete"});
        })
})

module.exports = router;
