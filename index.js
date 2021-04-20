 var express = require("express"),
  http = require('http');
  app = express(),
  bodyParser = require('body-parser'),
  log4js = require('log4js') ,
  mysql = require('mysql'),
  AppLoginController = require('./server/controllers/appLoginController'),
  Mysqlcon = require('./server/helpers/sqlConnections');

 var logger = log4js.getLogger('Ecommerce');
 logger.level = 'DEBUG';

  //app.use(bodyParser.json());
  app.use(bodyParser.json({limit:'2mb'}));
  app.use(bodyParser.urlencoded({
        extended: true
  }));


  app.use(function (req, res, next) {
     //Middle-ware to get errMessages...
     next();
  });


 //Configuring MySQL connection...
 Mysqlcon.makeConnection();

 var httpServer = http.createServer(app).listen(3000);
 
 app.all("/api/*", function (req, res, next) {
  logger.debug("inside CORS API");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization,  sessionkey, Content-Type, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS, DELETE");
    return next();
 });

 app.get("/", function(req, res) {
      res.send('Server Running');
 });

 logger.info('SERVER RUNNING');

new AppLoginController(app, Mysqlcon, logger);

 app.use(function(err, req, res, next) {
     console.log('Inside route error handler: ',err.stack);
     res.status(403).send('Bad Request!');
 });



