process.env.NODE_ENV = ( process.env.NODE_ENV && ( process.env.NODE_ENV ).trim().toLowerCase() == 'production' ) ? 'production' : 'development';
exec = require('child_process').exec

var express = require('express');
var app = express();
var logger = require('log4js').getLogger();
var bodyParser = require('body-parser');
var session = require('express-session');
var fs = require("fs");
var GitHubWebHook = require('express-github-webhook');
var webhookHandler = GitHubWebHook({path: '/studentsCode', secret: 'gkgkgk'});


var codePoolDirectory =  '../../../codePool/';

var MongoClient = require('mongodb').MongoClient;
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

var server = app.listen(3302, function(){
    logger.info('Express server has started on port 3302')
})

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(webhookHandler);
app.use(session({
  secret: 'gkgkgk12',
  resave: false,
  saveUninitialized: true
}));

// Now could handle following events 
webhookHandler.on('*', function (event, repo, data) {
    exec('cd ' + codePoolDirectory + ' && git clone ' + data.repository.clone_url, function(err, out, code) {
        logger.info('git clone success!!')
exec('python3 ../shellScript/main.py ' + codePoolDirectory + data.repository.name,function(err,out,code){
        logger.info('shell runned!!')
	console.log(err);
	console.log(out);
   });
    });
   logger.info(data.repository.clone_url);

   
   var id = data.repository.name;
   var urlValue = data.repository.html_url + '/blob/master/' + data.repository.name+'.py' // github url.
   
   dbUrl = 'mongodb://localhost:27017/test'
   MongoClient.connect(dbUrl, function(err, db){
    db.collection('analysisResultStatic').insert({_id:id, url:urlValue, dynamicId:id, studentId:id, problemId:1, score:0, totalSequence:1});
   });

});


webhookHandler.on('event', function (repo, data) {
   logger.info('2');
});

 
webhookHandler.on('reponame', function (event, data) {
   logger.info('3');
});
 
webhookHandler.on('error', function (err, req, res) {
   logger.info('4');
});
logger.info('start server');
var router = require('./router/main')(app,fs);

