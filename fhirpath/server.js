'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fhirpath = require('fhirpath');
const fhirpath_r4_model = require('fhirpath/fhir-context/r4');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.use(bodyParser());

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/', (req, res) => {
    const body = req.body;
    const data = body.data;
    const expr = body.expr;
    // console.log(body, data, expr);
    res.send(fhirpath.evaluate(data, expr, null, fhirpath_r4_model));
});


app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

