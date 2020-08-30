const express = require('express');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// Number of invoices in a day
let count = 0;

// Set response
function setResponse(username, invNum) {
    count++;
    for (let i = 0; i < count; i++) {
        invNum = incrementer(invNum);
    }
    return `<h2>Company Name: ${username} <br /> Invoice Number: ${invNum}</h2>`;
}

async function getInvoiceNumber(req, res, next) {
    try {
        const { username } = req.params;
        count = 0;
        // The following code generates the base invoice number for the day.
        let base = username.substring(0, 4).toUpperCase();
        let dateString = String(Date()).substring(4, 15).split(" ").join("").toUpperCase();
        base = base + "-" + dateString + "-" + "0000";

        // Set data to Redis. The setex method as an expiration argument in seconds. 86400 seconds is one day.
        client.setex(username, 86400, base);

        res.send(setResponse(username, base));

    } catch (err) {
        console.error(err);
        res.status(500);
    }
}

// The following function increments any Alphanumeric string, for example, ABC => ABD, AB1 => 2, 11034 => 11035 etc.
function incrementer(str) {
    if (str && str.length > 0) {
        var invNum = str;
        invNum = invNum.toUpperCase();
        var index = invNum.length - 1;
        while (index >= 0) {
            if (invNum.substr(index, 1) === "9") {
                invNum = invNum.substr(0, index) + "0" + invNum.substr(index + 1);
            } else if (invNum.substr(index, 1) === "Z") {
                invNum = invNum.substr(0, index) + "A" + invNum.substr(index + 1);
            } else {
                var char = String.fromCharCode(invNum.charCodeAt(index) + 1);
                invNum = invNum.substr(0, index) + char + invNum.substr(index + 1);
                index = 0;
            }
            index--;
        }
        return invNum;
    } else {
        throw new Error("str cannot be empty");
    }
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