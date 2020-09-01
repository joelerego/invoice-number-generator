const express = require('express');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const { promisify } = require("util");
const getAsync = promisify(client.get).bind(client);

const app = express();

// Set response
function setResponse(id, count) {

    let date = new Date();
    let invNum = id.substring(0, 4).toUpperCase() + "-" + date.getFullYear() + zeroPad(date.getMonth(), 2) + zeroPad(date.getDate(), 2) + "-" + zeroPad(count, 4);

    client.incr(id);

    return `${id}: ${invNum}`;
}

async function getInvoiceNumber(req, res, next) {
    try {
        const { id } = req.params;
        let count = 1;

        // Set data to Redis. The setex method as an expiration argument in seconds.
        client.set(id, count);

        res.send(setResponse(id, count));

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

function cache(req, res, next) {
    const { id } = req.params;
    client.get(id, (err, data) => {
        if (data !== null) {
            res.send(setResponse(id, data));
        } else {
            next();
        }
    });
}

app.get('/user/:id', cache, getInvoiceNumber);

app.listen(5000, () => {
    console.log(`App listening on port ${PORT}`);
});