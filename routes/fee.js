const express = require('express');
const app = express();
const router = express.Router();

router.get('',function (req,res,next){
    console.log("First");
    //next();
});

router.get('',function (req,res,next){
    console.log("Second");
    return res.status(200).json({message:'Hello'});
});

module.exports = router;
