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
    /***********************Issue type list
    Indentation : 0, Naming : 1, Comment : 2, WhiteSpace : 3,
    CodeFormat : 4, Statement : 5 , Function : 6, Class : 7, Module :8
    /*****************************/
    function Issue(name){
    	this.name = name;
    	this.count =0;
    	this.recommendID="";
    	this.recommendCount=0;

    }

    var issueArray = new Array();
    issueArray[0] = new Issue("Indentation");issueArray[1] = new Issue("Naming");
    issueArray[2] = new Issue("Comment");    issueArray[3] = new Issue("WhiteSpace");
    issueArray[4] = new Issue("CodeFormat"); issueArray[5] = new Issue("Statement");
    issueArray[6] = new Issue("Function");   issueArray[7] = new Issue("Class");
    issueArray[8] = new Issue("Module");
    
    averageComplexity = 0;
    var ErrorCountObj= new Object();
    var StaticInfo = new Array();
    var StudentList = new Array();
    var UrlList = new Array();

    var StudentCode = new Array();
    var IssueCode = new Array();
    var IndividualInfo = new Array();
    var RecommendCode = new Array();

    async.series([
    	function(callback){
    		docsCollection.find({}).toArray(function(err, result){
    			IndividualInfo.push(result);
    			numStudent = result.length;

    			for(var i =0; i<numStudent;i++){
    				var tmp = new Object();

    				tmp.id = result[i]._id;

    				/******new code : G*************/
    				for(var j=0; j<issueArray.length; j++)
    					tmp.cnt += result[i].issueArray[j].name.count;
    				/********************************/
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

/********* New code : C**********/
for( var j=0; j<issueArray.length; j++)
	issueArray[j].count +=result[i].issueArray[j].name.count;
/********************************/

/************New code : D**************/
for(var j=0; j<issueArray.length; j++)
{
	if(result[i].issueArray[j].name.count > issueArray[j].recommendCount)
	{
		issueArray[j].recommendCount = result[i].issueArray[i].name.count;
		issueArray[j].recommendID = result[i]._id;
	}
}
/********************************/

var mydocs = new Object();
mydocs.id = result[i]._id;
mydocs.children = new Array();

/***********New code : E ***********************/
for(var j=0; j<issueArray.length; j++)
{
	for(var k=0; k<result[i].issueArray[j].name.count; k++){
		if(ErrorCountObj[result[i].issueArray[j].name.error[k].name] ==null){
			ErrorCountObj[result[i].issueArray[j].name.error[k].name] =0;
		}
		ErrorCountObj[result[i].issueArray[j].name.error[k].name]++;
		var myissue = new Object();
		myissue.name = result[i].issueArray[j].name.error[k].name;
		myissue.row = result[i].issueArray[j].name.error[k].row;
		mydocs.children.push(myissue);
	}
}
/**********************************************/

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
  			/*********New code : F***********************/
  			for(var j=0; j<issueArray.length; j++){
  				if(result[i]._id == issueArray[j].recommendID){
  					var issueTypeUrl = issueArray[j].name.toLowerCase()+"URL";
  					tmp.issueTypeUrl = result[i].url;
  				}
  			}
  			/**********************************************/
  			RecommendCode.push(tmp);

  			for(var j = 0; j < numUrl; j++)
  			{
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
		IndenCount:issueArray[0].count, 
		NamingCount:issueArray[1].count, 
		CommentCount:issueArray[2].count, 
		WhiteSpaceCount:issueArray[3].count, 
		CodeFormatCount:issueArray[4].count, 
		StatementCount:issueArray[5].count, 
		FunctionCount:issueArray[6].count, 
		ClassCount:issueArray[7].count, 
		ModuleCount:issueArray[8].count,
		// Need to modify ther render parameter itself.
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
