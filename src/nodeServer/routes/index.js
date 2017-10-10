var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var async = require('async');
var fs = require('fs');
var exec = require('child_process').exec;
var _ = require('underscore');

var mossUrl = ''
var flag = 0;
Object.size = function(obj){
	var size = 0, key;
	for (key in obj){
	  if(obj.hasOwnProperty(key)) size++;
	}
	return size;
};


/* GET moss url by User Post Request*/
router.post('/CopyCheck',function(req,res){
        exec('cd /home/kdwhan27/nodeSever/viewreful/public/codePool2/ && ./moss.sh', function(err, out, code) {
		flag = 0;
                mossUrl = out;
		res.redirect('/');
        });
})
router.post('/CopyCheck2',function(req,res){
        exec('cd /home/kdwhan27/nodeSever/viewreful/public/codePool/ && ./moss.sh', function(err, out, code) {
		flag = 1;
                mossUrl = out;
		console.log(mossUrl)
                res.redirect('/comp');
        });
})

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  dbUrl = 'mongodb://localhost:27017/test'

  MongoClient.connect(dbUrl, function(err, db){
    var docsCollection = db.collection('docs2');
    var urlsCollection = db.collection('urls2');   
    var issueCollection = db.collection('issueDescription');

    var numStudent = 0;
    var indenCnt = 0, 
	namingCnt = 0, 
	commentCnt = 0,
	whiteCnt = 0, 
	formatCnt = 0, 
	statementCnt = 0, 
	funcCnt = 0, 
	classCnt = 0, 
	moduleCnt = 0;
	averageComplexity = 0;
    var ErrorCountObj= new Object();
    var StaticInfo = new Array();
    var StudentList = new Array();
    var UrlList = new Array();

    var StudentCode = new Array();
    var IssueCode = new Array();
    var IndividualInfo = new Array();
    var RecommendCode = new Array();
    var recommendID = new Array();

    recommendID['indentationCnt'] = 0;
    recommendID['namingCnt'] = 0;
    recommendID['commentCnt'] = 0;
    recommendID['whitespaceCnt'] = 0;
    recommendID['codeformatCnt'] = 0;
    recommendID['statementCnt'] = 0;
    recommendID['functionCnt'] = 0;
    recommendID['classCnt'] = 0;
    recommendID['moduleCnt'] = 0;
    
async.series([
  function(callback){
    docsCollection.find({}).toArray(function(err, result){
        IndividualInfo.push(result);
	numStudent = result.length;

	for(var i =0; i<numStudent;i++){
	  var tmp = new Object();
	  
	  tmp.id = result[i]._id;
	  tmp.cnt = result[i].Indentation.count + result[i].Naming.count + result[i].Comment.count+ result[i].WhiteSpace.count+result[i].CodeFormat.count+result[i].Statement.count+result[i].Function.count+result[i].Class.count+result[i].Module.count;
	  tmp.blockDepth = result[i].blockDepth;
	  tmp.maxBlockDepth = result[i].blockDepth;
	  tmp.numBlocks = result[i].numBlocks;
	  tmp.numCharacters = result[i].numCharacters;
	  tmp.numClasses = result[i].numClasses;
	  tmp.numComments = result[i].numComments;
	  tmp.numCommentsInline = result[i].numCommentsInline;
	  tmp.numFunctions = result[i].numFunctions;
	  tmp.numKeywords = result[i].numKeywords;
	  tmp.numLines = result[i].numLines;
	  tmp.numModuleDocStrings = result[i].numModuleDocStrings;
	  tmp.numSrcLines = result[i].numSrcLines;
	  tmp.numTokens = result[i].numTokens;
	  tmp.__main__ = result[i].__main__;
	  tmp.IndentationCount = result[i].Indentation.count;
	  tmp.NamingCount = result[i].Naming.count;
	  tmp.CommentCount = result[i].Comment.count;
	  tmp.WhiteSpaceCount = result[i].WhiteSpace.count;
	  tmp.CodeFormatCount = result[i].CodeFormat.count;
	  tmp.StatementCount = result[i].Statement.count;
	  tmp.FunctionCount = result[i].Function.count;
	  tmp.ClassCount = result[i].Class.count;
	  tmp.ModuleCount = result[i].Module.count;

	  //function is dynamic.
//	  console.log(tmp);
	  var rsize = Object.size(result[i]);
//	  console.log(rsize);

	  StudentList.push(tmp);

	  indenCnt += result[i].Indentation.count;
	  namingCnt += result[i].Naming.count;
	  commentCnt += result[i].Comment.count;
	  whiteCnt += result[i].WhiteSpace.count;
	  formatCnt += result[i].CodeFormat.count;
	  statementCnt += result[i].Statement.count;
	  funcCnt += result[i].Function.count;
	  classCnt += result[i].Class.count;
	  moduleCnt += result[i].Module.count;
	  
	  if(result[i].Indentation.count > recommendID['indentationCnt']){
		recommendID['indentationCnt'] = result[i].Indentation.count;
		recommendID['indentation'] = result[i]._id;
	  } 
	  if(result[i].Naming.count > recommendID['namingCnt']){
		recommendID['namingCnt'] = result[i].Naming.count;
		recommendID['naming'] = result[i]._id;
	  }
	  if(result[i].Comment.count > recommendID['commentCnt']){
		recommendID['commentCnt'] = result[i].Comment.count;
		recommendID['comment'] = result[i]._id;
	  } 
	  if(result[i].WhiteSpace.count > recommendID['whitespaceCnt']){
		recommendID['whitespaceCnt'] = result[i].WhiteSpace.count;
		recommendID['whitespace'] = result[i]._id;
	  }
	  if(result[i].CodeFormat.count > recommendID['codeformatCnt']){
		recommendID['codeformatCnt'] = result[i].CodeFormat.count;
		recommendID['codeformat'] = result[i]._id;
	  }
	  if(result[i].Statement.count > recommendID['statementCnt']){
		recommendID['statementCnt'] = result[i].Statement.count;
		recommendID['statement'] = result[i]._id;
	  }
	  if(result[i].Function.count > recommendID['functionCnt']){
		recommendID['functionCnt'] = result[i].Function.count;
		recommendID['function'] = result[i]._id;
	  }
	  if(result[i].Class.count > recommendID['classCnt']){
		recommendID['classCnt'] = result[i].Class.count;
		recommendID['class'] = result[i]._id;
	  }
	  if(result[i].Module.count > recommendID['moduleCnt']){
		recommendID['moduleCnt'] = result[i].Module.count;
		recommendID['module'] = result[i]._id;
	  }

	  var mydocs = new Object();
	  mydocs.id = result[i]._id;
	  mydocs.children = new Array();

	  for(var j=0; j<result[i].Indentation.count;j++){
	    if(ErrorCountObj[result[i].Indentation.error[j].name] == null){ErrorCountObj[result[i].Indentation.error[j].name] = 0 }//initialize

	    ErrorCountObj[result[i].Indentation.error[j].name]++;
		var myissue = new Object();
		myissue.name = result[i].Indentation.error[j].name;
		myissue.row = result[i].Indentation.error[j].row;
		mydocs.children.push(myissue);
	  }
	  for(var j=0; j<result[i].Naming.count;j++){
	    if(ErrorCountObj[result[i].Naming.error[j].name] == null){ErrorCountObj[result[i].Naming.error[j].name] = 0 }//initialize

	    ErrorCountObj[result[i].Naming.error[j].name]++;
                var myissue = new Object();
                myissue.name = result[i].Naming.error[j].name;
                myissue.row = result[i].Naming.error[j].row;
                mydocs.children.push(myissue);
	  }
	  for(var j=0; j<result[i].Comment.count;j++){
	    if(ErrorCountObj[result[i].Comment.error[j].name] == null){ErrorCountObj[result[i].Comment.error[j].name] = 0 }//initialize

	    ErrorCountObj[result[i].Comment.error[j].name]++;
                var myissue = new Object();
                myissue.name = result[i].Comment.error[j].name;
                myissue.row = result[i].Comment.error[j].row;
                mydocs.children.push(myissue);
	  }
	  for(var j=0; j<result[i].WhiteSpace.count;j++){
	    if(ErrorCountObj[result[i].WhiteSpace.error[j].name] == null){ErrorCountObj[result[i].WhiteSpace.error[j].name] = 0 }//initialize

	    ErrorCountObj[result[i].WhiteSpace.error[j].name]++;
                var myissue = new Object();
                myissue.name = result[i].WhiteSpace.error[j].name;
                myissue.row = result[i].WhiteSpace.error[j].row;
                mydocs.children.push(myissue);
	  }
	  for(var j=0; j<result[i].CodeFormat.count;j++){
	    if(ErrorCountObj[result[i].CodeFormat.error[j].name] == null){ErrorCountObj[result[i].CodeFormat.error[j].name] = 0 }//initialize

	    ErrorCountObj[result[i].CodeFormat.error[j].name]++;
                var myissue = new Object();
                myissue.name = result[i].CodeFormat.error[j].name;
                myissue.row = result[i].CodeFormat.error[j].row;
                mydocs.children.push(myissue);
	  }
	  for(var j=0; j<result[i].Statement.count;j++){
	    if(ErrorCountObj[result[i].Statement.error[j].name] == null){ErrorCountObj[result[i].Statement.error[j].name] = 0 }//initialize

	    ErrorCountObj[result[i].Statement.error[j].name]++;
                var myissue = new Object();
                myissue.name = result[i].Statement.error[j].name;
                myissue.row = result[i].Statement.error[j].row;
                mydocs.children.push(myissue);
	  }
	  for(var j=0; j<result[i].Function.count;j++){
	    if(ErrorCountObj[result[i].Function.error[j].name] == null){ErrorCountObj[result[i].Function.error[j].name] = 0 }//initialize

	    ErrorCountObj[result[i].Function.error[j].name]++;
                var myissue = new Object();
                myissue.name = result[i].Function.error[j].name;
                myissue.row = result[i].Function.error[j].row;
                mydocs.children.push(myissue);
	  }
	  for(var j=0; j<result[i].Class.count;j++){
	    if(ErrorCountObj[result[i].Class.error[j].name] == null){ErrorCountObj[result[i].Class.error[j].name] = 0 }//initialize

	    ErrorCountObj[result[i].Class.error[j].name]++;
                var myissue = new Object();
                myissue.name = result[i].Class.error[j].name;
                myissue.row = result[i].Class.error[j].row;
                mydocs.children.push(myissue);
	  } 
	  for(var j=0; j<result[i].Module.count;j++){
	    if(ErrorCountObj[result[i].Module.error[j].name] == null){ErrorCountObj[result[i].Module.error[j].name] = 0 }//initialize

	    ErrorCountObj[result[i].Module.error[j].name]++;
                var myissue = new Object();
                myissue.name = result[i].Module.error[j].name;
                myissue.row = result[i].Module.error[j].row;
                mydocs.children.push(myissue);
	  }
	////////////////////////////////////Code & Issue Position/////////////////////////////////////
	var tempCode = new Object();
	mydocs.children.sort(function(a,b){
		return a.row <b.row?-1:a.row>b.row?1:0;
	});
	tempCode.id = tmp.id;
	tempCode.code = fs.readFileSync('./public/codePool2/'+tmp.id+'/'+tmp.id+'.py','utf8');
	tempCode.position = '';	
	var flag = 1;//flag for row 
	for(var j =0; j<mydocs.children.length; j++){
		if(flag != mydocs.children[j].row){
			for(var k=1; k<=mydocs.children[j].row - flag; k++){tempCode.position += '.\n';}
			flag = mydocs.children[j].row;
		}
		tempCode.position =tempCode.position + mydocs.children[j].name + ',';
	}
	for(var j=flag; j<=result[i].numLines;j++){
		tempCode.position += '.\n';	
	}	

	StudentCode.push(tempCode);
	///////////////////////////////////////////////////////////////////////////////////////////////

	}
	var tempSum=0;
	for(var i =0; i < result.length; i++){
	 tempSum += _.map(StudentList)[i].__main__;
         for(var j = 0; j < result.length; j++){
          if(_.map(StudentList)[i].id == _.map(StudentCode)[j].id){
           _.map(StudentList)[i].code = _.map(StudentCode)[j].code;
	   _.map(StudentList)[i].position = _.map(StudentCode)[j].position;
           break;
          }
         }
        }
	averageComplexity = tempSum/result.length;
	callback();	
    });//docs.find end
  },//first callback end
  function(callback){
    urlsCollection.find({}).toArray(function(err,result){
	var numUrl = result.length;
	var tmp = new Object();

	for(var i =0; i < numUrl; i++){

	  if(result[i]._id == recommendID['indentation']){
		tmp.indentationURL = result[i].url;
	  }

	  if(result[i]._id == recommendID['naming']){
		tmp.namingURL = result[i].url;
	  }

	  if(result[i]._id == recommendID['comment']){
		tmp.commentURL = result[i].url;
	  }

	  if(result[i]._id == recommendID['whitespace']){
		tmp.whitespaceURL = result[i].url;
	  }

	  if(result[i]._id == recommendID['codeformat']){
		tmp.codeformatURL = result[i].url;
	  }

	  if(result[i]._id == recommendID['statement']){
		tmp.statementURL = result[i].url;
	  }

	  if(result[i]._id == recommendID['function']){
		tmp.functionURL = result[i].url;
	  }

	  if(result[i]._id == recommendID['class']){
		tmp.classURL = result[i].url;
	  }

	  if(result[i]._id == recommendID['module']){
		tmp.moduleURL = result[i].url;
	  }
	RecommendCode.push(tmp);	
	 for(var j = 0; j < numUrl; j++){
 	    if(_.map(StudentList)[i].id == result[j]._id){
	     _.map(StudentList)[i].url = result[j].url;
	     break;
	   } 
	  }
	}

	
	  
	callback();
    });  
  },//second callback end  
  function(callback){
    issueCollection.find({}).toArray(function(err,result){
	for(var i =0; i<Object.keys(ErrorCountObj).length;i++){
		var keys = Object.keys(ErrorCountObj);		
		var tmp = new Object();
		tmp.id = keys[i];
		tmp.count = Object.values(ErrorCountObj)[i];
		tmp.korean = _.values(result[0][keys[i]])[1];
		IssueCode.push(tmp);	
		
	}
	callback();
    });

  }//third callback end
], //task end

function(err){
    if(err) console.log(err);
    StudentList.sort(function(a,b){
	return a.cnt > b.cnt ? -1 : a.cnt < b.cnt ? 1 : 0 ;
    });
	console.log('here');
    res.render('home',{
	IndenCount:indenCnt, 
	NamingCount:namingCnt, 
	CommentCount:commentCnt, 
	WhiteSpaceCount:whiteCnt, 
	CodeFormatCount:formatCnt, 
	StatementCount:statementCnt, 
	FunctionCount:funcCnt, 
	ClassCount:classCnt, 
	ModuleCount:moduleCnt,
	FilterArray:IssueCode,FilterArrayLength:Object.keys(ErrorCountObj).length, 
	StudentList:StudentList,StudentListLength:Object.keys(StudentList).length,
	UrlList:UrlList,
	IndividualInfo:IndividualInfo,
	mossUrl:mossUrl,
	RecommendCode:RecommendCode,
	averageComplexity:averageComplexity
    });
  });//async end

  });//connect end
});//get end



module.exports = router;
