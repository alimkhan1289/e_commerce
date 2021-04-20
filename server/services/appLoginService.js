/**
 * Created by Alim
 */
var uuid = require('node-uuid');

function AppLoginService(app, Mysqlcon, logger) {
    logger.debug('Inside AppLoginService');

    var executeSqlQry = function (qry, callback){
        logger.debug('executeSqlQry : '+qry);
        Mysqlcon.executeSqlQry(qry,function(err, result){
            callback(err, result);
        });
    };

    var sessionKeyGenerator = function(userId,logInTime, type){
        var sessionKey = uuid.v4();
        var newLogInTime = getCurrentTime();
        return (sessionKey);
    };

    var getCurrentTime = function(){
        var currTime =  new Date()//.toISOString();
        var month  = currTime.getMonth() + 1;
        currTime = currTime.getFullYear()+ '-' +month+ '-' +currTime.getDate()+' '+currTime.getHours()+':'+currTime.getMinutes()+':'+currTime.getSeconds();
        return currTime;
    }

    this.sessionKeyVerification = function(header, callback){
        logger.debug('Inside user sessionKey Verification');
        logger.debug('HEADER : '+header);
        var sessionKey = header.sessionkey;
        var userId ; paramList = [];
        if(!sessionKey){
            logger.debug('Provide  sessionKey');
            callback({success: 0, errCode: 1, data: {} ,errMessage: "Provide sessionkey"});
        }else {
            logger.debug("sessionKey verification will be done using sessionKey");
            qry = 'SELECT * FROM user WHERE sessionKey=?';
            paramList = [sessionKey];
            finalQry = [qry,paramList];
            logger.debug('user sessionKeyVerification Query : ' + finalQry);
            executeSqlQry(finalQry,function(err,rows){
                if(err) {
                    logger.error('err'+err);
                    callback({success: 0, errCode: 1, data: {} ,errMessage: "Mysql error"});
                }else if (!err && rows.length) {
                    var logInTime = rows[0].logInTime;
                    var result = rows[0];
                    logger.debug('sessionKeyVerification db data : '+JSON.stringify(rows));
                    callback({errResp: 0, userId: rows[0].id});
                } else {
                    logger.debug('sessionKey expired, login again: ', JSON.stringify(rows));
                    callback({success: 0, errCode: 1, data: {} ,errMessage: "Session expired, login again"});
                }
            });
        }
    };

    this.userRegistration = function(data, callback){ // Add B2B User data
        logger.debug("Inside userRegistration service", data);
        var qry = [`select id from user where emailId=?`,[data.emailId]];
        executeSqlQry(qry,function(err,rows){
            if(err) {
                logger.warn('MySQL error in find user emailId: '+ err);
                callback({success: 0, errCode: 1, data: {} ,errMessage: "Mysql error"});
            }else if (!err && rows.length > 0) {
                logger.debug('emailId already exists');
                logger.debug("Rows: ", JSON.stringify(rows))
                callback({success: 0, errCode: 1 ,data: {} ,errMessage:"emailId already exists"}); 
            }else{
                var qry = `insert into user set ?`;
                var dataSet = {
                    "emailId":data.emailId,
                    "password":data && data.password
                };
                executeSqlQry([qry,[dataSet]],function(err,rows){
                    if(err) {
                        logger.error('MySQL error in add user : '+ err);
                        callback({success: 0, errCode: 1, data: {} ,errMessage: "Mysql error"});
                    }else{
                        logger.debug('user added Successfully');
                        callback({success: 1, errCode: 0, data: {} ,errMessage: 'user registration successful'});
                    }
                });
            }
        });
    };

    this.userLogin = function(req, callback){
        logger.debug('Inside userLogin service:');
        var body = req.body;
        var currTime = Date.now();
        logger.debug('userLogin service body:' + JSON.stringify(body));
        if(!body.emailId || !body.password) {
            logger.error('Neither userName and password provided');
            callback({success: 0, errCode: 1 ,data: {} ,errMessage:'emailId or password missing'});
        } else{
            let emailId = body.emailId,password = body.password;
            var qry = 'SELECT * FROM user WHERE emailId = ? AND BINARY password =  ?';
            logger.debug('userLogin Query : ' + qry);
            executeSqlQry([qry,[emailId, password]],function(err,rows){
                if(err) {
                    logger.error('MySQL error in userLogin :'+ err);
                    callback({success: 0, errCode: 1, data: {} ,errMessage:'Mysql error'});
                }else if (!err && rows.length) {
                    var userId = rows[0].id, emailId = rows[0].emailId, logInTime = rows[0].logInTime;
                    var newLogInTime = getCurrentTime();
                    var sessionKey = sessionKeyGenerator(userId,newLogInTime);
                    var resp = {
                        'sessionKey': sessionKey,
                        'userId': userId,
                        'emailId':emailId
                    };
                    logger.debug('db data : '+JSON.stringify(rows));
                    let statement = {
                        sessionKey : sessionKey, 
                        logInTime : newLogInTime
                    };
                    qry = [`update user set ? where id = ?`,[statement,userId]];
                    logger.debug('update sessionKey in userLogin qry: ' + qry);
                    executeSqlQry(qry,function(err,res){
                        if(err) {
                            logger.error('update sessionKey in b2bUserLogin err:' +err);
                            callback({success: 0, errCode: 1, data: {} ,errMessage:'Mysql error'});
                        }else{
                            callback({success: 1, errCode: 0, data:resp, errMessage: '' });
                        }
                    });
                }else {
                    logger.debug('Incorrect emailId or password');
                    callback({success: 0, errCode: 1, data: {} ,errMessage:'Incorrect emailId or password'});
                }
            });
        }
    };

    this.productList = function(req, callback){
        logger.debug('Inside product list service:');
        var qry = `SELECT * FROM product`;
        logger.debug('productList Query : ' + qry);
        executeSqlQry(qry,function(err,rows){
            if(err) {
                logger.error('MySQL error in productList :'+ err);
                callback({success: 0, errCode: 1, items: [] ,errMessage:'Mysql error'});
            }else {
                logger.debug('product list length:', rows.length);
                callback({success: 1, errCode: 0, items: rows ,errMessage:''});
            }
        });
    };

     this.addProductToCart = function(data, callback){ // Add product to user cart
        logger.debug("Inside addProductToCart service", data);
        var qry = [`select * from user_cart where userId=? AND productId=?`,[data.userId,data.productId]];
        executeSqlQry(qry,function(err,rows){
            if(err) {
                logger.warn('MySQL error in find product in user cart: '+ err);
                callback({success: 0, errCode: 1, data: {} ,errMessage: "Mysql error"});
            }else if (!err && rows.length > 0) {
                logger.debug('product is already in user cart');
                logger.debug("Rows: ", JSON.stringify(rows))
                if(rows[0].quantity == data.quantity) {
                    callback({success: 0, errCode: 1 ,data: {} ,errMessage:"Already in cart"}); 
                }
                else {
                    var updateQry = [`update user_cart set quantity=? where id=?`,[data.quantity,rows[0].id]]
                    executeSqlQry(updateQry,function(err,rows){
                        if(err) {
                            logger.error('MySQL error in update product quantity to user cart : '+ err);
                            callback({success: 0, errCode: 1, data: {} ,errMessage: "Mysql error"});
                        }else{
                            logger.debug('product quantity updated');
                            callback({success: 1, errCode: 0, data: {} ,errMessage: 'Product added in cart'});
                        }
                    });
                }
            }else{
                var qry = `insert into user_cart set ?`;
                var dataSet = {
                    "userId":data.userId,
                    "productId":data && data.productId,
                    "quantity": data && data.quantity
                };
                executeSqlQry([qry,[dataSet]],function(err,rows){
                    if(err) {
                        logger.error('MySQL error in add product to user cart : '+ err);
                        callback({success: 0, errCode: 1, data: {} ,errMessage: "Mysql error"});
                    }else{
                        logger.debug('product added Successfully');
                        callback({success: 1, errCode: 0, data: {} ,errMessage: 'Product added in cart'});
                    }
                });
            }
        });
    };

    this.productListInUserCart = function(userId, callback){
        logger.debug('Inside productListInUserCart service:');
        var qry = [`SELECT UC.id, UC.productId, UC.userId, UC.quantity, UC.createdAT as addedOn, P.name, P.description, P.price, P.make from user_cart as UC left join product as P on UC.productId=P.id where UC.userId=?`,[userId]];
        logger.debug('productList in user cart Query : ' + qry);
        executeSqlQry(qry,function(err,rows){
            if(err) {
                logger.error('MySQL error in productList :'+ err);
                callback({success: 0, errCode: 1, items: [] ,errMessage:'Mysql error'});
            }else {
                logger.debug('product list in user cart:', rows);
                callback({success: 1, errCode: 0, items: rows ,errMessage:''});
            }
        });
    };
};

module.exports = AppLoginService;
