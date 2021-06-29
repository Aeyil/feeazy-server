let express = require('express');
let cors = require('cors');
const db = require('./db');
const app = express();
app.use(cors());

let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const authMiddlewareRoute = require('./routes/auth');
const registerRoute = require('./routes/register');
const loginRoute = require('./routes/login');
const groupRoute = require('./routes/group');
const feeRoute = require('./routes/fee');
const presetRoute = require('./routes/preset');

app.use('/register',registerRoute);
app.use('/login',loginRoute);
app.use('/group',authMiddlewareRoute,groupRoute);
app.use('/fee',authMiddlewareRoute,feeRoute);
app.use('/preset',authMiddlewareRoute,presetRoute);

app.use("*", (req,res) =>{
    res.send("Welcome to the Feeazy Server!");
})

db.initDb.then(() => {
    app.listen(PORT,() =>{
        console.log('Listening on Port ' + PORT + '...');
    });
}, () => {
    console.log('Failed to connect to Heroku DB.')
});
