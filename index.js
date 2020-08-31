const express = require('express');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// Set response
function setResponse(username, count) {

    let base = username.substring(0, 4).toUpperCase();
    let dateString = String(Date()).substring(4, 15).split(" ").join("").toUpperCase();
    base = base + "-" + dateString + "-" + zeroPad(count, 4);

    let newCount = Number(count) + 1;
    client.set(username, newCount);

    return `${username}: ${base}`;
}

async function getInvoiceNumber(req, res, next) {
    try {
        const { username } = req.params;
        let count = 1;

        // Set data to Redis. The setex method as an expiration argument in seconds.
        client.setex(username, count, 86400);

        res.send(setResponse(username, count));

    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

function zeroPad(number, width) {
    let string = String(number);
    while (string.length < width) {
        string = "0" + string;
    }
    return string;
}


// Cache middleware
function cache(req, res, next) {
    const { username } = req.params;
    client.get(username, (err, data) => {
        if (data !== null) {
            res.send(setResponse(username, data));
        } else {
            next();
        }
    });
}

app.get('/user/:username', cache, getInvoiceNumber);

app.listen(5000, () => {
    console.log(`App listening on port ${PORT}`);
});