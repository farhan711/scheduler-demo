var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

var port = 3001;

var app = express(); 

app.use(cors())

app.use(bodyParser.urlencoded({extended:true}));

app.use(bodyParser.json());

var sign_s3 = require('./controllers/sign_s3')

app.use('/sign_s3', sign_s3.sign_s3)

app.listen(port)
