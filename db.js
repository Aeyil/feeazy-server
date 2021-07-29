let pgp = require('pg-promise');
const { Pool, Client } = require('pg');

let pool;

let initDb = new Promise((resolve, reject) => {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        max: 15,
        idleTimeoutMillis: 15000
    });
    pool.connect()
        .then(client => {
            client.release();
            resolve();
        })
        .catch(() => {
            reject();
        });
});

let getClient = function (){
    return new Promise((resolve,reject) => {
        pool.connect()
            .then(client => resolve(client))
            .catch(() => reject());
    });
}

module.exports = {
    getClient,
    initDb
}
