const express = require('express');
const logger = require('morgan');

const gtbankRouter = require('./routes/gtbank');
const gtworldRouter = require('./routes/gtworld');
const ecobankRouter = require('./routes/ecobank');

const app = express();

app.use(logger('dev'));
app.use(express.json());

app.use('/gtbank', gtbankRouter);
app.use('/gtworld', gtworldRouter);
app.use('/ecobank', ecobankRouter);

module.exports = app;
