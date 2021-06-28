let express = require('express');
let cors = require('cors');
const db = require('./db');
const app = express();
app.use(cors());

let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// TODO: Routes to Functionality

app.use("*", (req,res) =>{
    res.send("Welcome to the Feeasy Server!");
})

db.initDb.then(() => {
    app.listen(PORT,() =>{
        console.log('Listening on Port ' + PORT + '...');
    });
}, () => {
    console.log('Failed to connect to Heroku DB.')
});
