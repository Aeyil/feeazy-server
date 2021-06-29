const express = require('express');
const jwt = require('jsonwebtoken');
const cfg = require('../config.json');
const app = express();
const router = express.Router();

router.use(function(req,res,next){
   jwt.verify(req.headers.authorization, cfg.auth.token, function(err,decoded) {
      if(err){
          return res.status(401).json({message: "Authentication failed."});
      }
      else{
          req.userData = JSON.parse("{\"id\": \"" + decoded.id + "\"}");
          next();
      }
   });
});

module.exports = router;
