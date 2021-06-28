let cfg = require('./config.json');
let pgp = require('pg-promise');
const { Client } = require('pg');

let client;

let initDb = new Promise((resolve, reject) => {
    client = new Client({
        host: cfg.database.host,
        user: cfg.database.user,
        password: cfg.database.password,
        database: cfg.database.db,
        ssl: true
    });
    client.connect()
        .then(() => resolve())
        .catch((err) => {
            console.log('DB CONNECTION ERROR\n'+err.stack);
            reject();
        });
});

function getDb() {
    if(!client) {
        console.log('ERROR! DB NOT INITIALIZED YET.');
        return;
    }
    return client;
}

module.exports = {
    getDb,
    initDb
}
