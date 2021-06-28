let pgp = require('pg-promise');
const { Client } = require('pg');

let client;

let initDb = new Promise((resolve, reject) => {
    client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
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
