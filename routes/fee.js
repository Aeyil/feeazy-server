const express = require('express');
const app = express();
const router = express.Router();

router.get('',function (req,res,next){
    // Expected Parameters
    //   req.body.group_id
    if(!req.body.hasOwnProperty('group_id')){
        next();
    }
    console.log('First');
});

router.get('',function (req,res){
    // Expected Parameters
    //   - none
    console.log("Second");
    return res.status(200).json({message:'Hello'});
});

module.exports = router;
