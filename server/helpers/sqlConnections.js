var mysql = require('mysql');

var clusterConfig = {
  //removeNodeErrorCount: 10,
  defaultSelector: 'ORDER'
};

var poolCluster;
var localDb = {host: '0.0.0.0',user: 'root',password: 'root123',database: 'e_commerce'};

const sqlConnectionModule = {
	makeConnection:makeConnection,
	executeSqlQry:executeSqlQry
};

//exports.makeConnection = function(){
function makeConnection(){
    poolCluster = mysql.createPoolCluster(clusterConfig);

        console.log('Adding local connection');
        poolCluster.add('LOCAL', localDb);
}


var local = function(callback){
        poolCluster.getConnection('LOCAL',function (err, connection) {
            callback(err, connection);
        });
}

var executeQry = function(connection, qry, callback){

        if(typeof qry == 'object'){
        console.log(qry[0] , qry[1]);
        connection.query(qry[0],qry[1],function(err,result){
                    connection.release();
                    callback(err,result);
        });
        }else{
        connection.query(qry,function(err,result){
                    connection.release();
                    callback(err,result);
        });
        }

}

//exports.executeSqlQry = function (qry, callback){
function executeSqlQry(qry, callback){
    console.log('executeSqlQry : '+qry);
    console.log('Getting Local Connection for read/write');
    local(function(error, connection){
        if(error){
            if(error.code=="POOL_NOEXIST" || error.code == "ECONNREFUSED"){
                  console.log('Connection problem, restarting sql service');
                  makeConnection();
            }
            callback(error,'');
        }else{
            executeQry(connection, qry, function(err,result){
            callback(err,result);
            });
        }
    });
}

module.exports = sqlConnectionModule;
