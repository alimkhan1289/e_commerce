/**
 * Created by Alim
 */

var bodyParser = require('body-parser');
var LoginService = require('./../services/appLoginService');
var validator = require('validator');

function AppLoginController (app, Mysqlcon, logger) {
	logger.debug('Inside AppLoginController:');
	var loginService = new LoginService(app, Mysqlcon, logger);

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	// API to register user data in the system
	app.post('/api/user/registration', function(req, res){
		logger.info('Inside user registration controller:');
		var body = req && req.body;
		logger.info('Req body data in user registration:', body);
		let emailId = body && body.emailId;
		let password = body && body.password;
		if(!emailId || !password) {
			return res.json({success: 0, errCode: 1 ,data: {} ,errMessage:'emailId or password required'});
		}
		if(!validator.isEmail(emailId)) {
			logger.debug('Invalid emailId');
			return res.json({success: 0, errCode: 1 ,data: {} ,errMessage:'Invalid emailId'});
		}
		loginService.userRegistration(body, function(result){
			res.send(result);
		});
	});

	//API to login user
	app.post('/api/user/login', function (req, res){
		logger.info('Inside login API:');
        logger.info(req.headers);
        logger.info(req.body);
        loginService.userLogin(req, function(ack){
            logger.debug('userLogin response: '+JSON.stringify(ack));
            res.send(ack);
        });
    });

    // API to get product list
    app.get('/api/product/list', function (req, res){
		logger.info('Inside product list api:');
        logger.info(req.headers);
        logger.info(req.body);
        loginService.productList(req, function(ack){
            logger.debug('productList response: '+JSON.stringify(ack));
            res.send(ack);
        });
    });

    //API to add product in user cart
	app.post('/api/user/addproduct', function (req, res){
		logger.info('Inside add product to cart:');
        logger.info(req.headers);
        logger.info(req.body);
        var body = req && req.body;
        let productId = body && body.productId;
		if(!productId) {
			return res.json({success: 0, errCode: 1 ,data: {} ,errMessage:'productId is required'});
		}
		if(!body.quantity) {
			body.quantity = 1;
		}
        loginService.sessionKeyVerification(req.headers, function(result){
			logger.debug('sessionKeyVerification result data:',JSON.stringify(result));
			var errResp = result.errResp;
			if(errResp == 0) {
				body.userId = result.userId;
				loginService.addProductToCart(body, function(result){
					res.send(result);
				});
			}else{
				logger.debug('Error response:');
				return res.json(result);
			}
		});
    });

    //API to get list of product in user cart
	app.get('/api/user/listproduct', function (req, res){
		logger.info('Inside get product list in user cart:');
        logger.info(req.headers);
        logger.info(req.body);
        loginService.sessionKeyVerification(req.headers, function(result){
			logger.debug('sessionKeyVerification result data:',JSON.stringify(result));
			var errResp = result.errResp;
			if(errResp == 0) {
				loginService.productListInUserCart(result.userId, function(result){
					res.send(result);
				});
			}else{
				logger.debug('Error response:');
				return res.json(result);
			}
		});
    });
};

module.exports = AppLoginController;