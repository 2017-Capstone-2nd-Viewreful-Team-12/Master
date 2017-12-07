var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var Schema = mongoose.Schema;

// Professor
var professorSchema = mongoose.Schema({
	_id: String,
	name : String,
});

// Lecture
var lecturesSchema = mongoose.Schema({
	_id : String,
	name : String,
	professorsId : Array
});

// Student
var studentSchema = mongoose.Schema({
	_id : String,
    // Student_has_Lecture
    lecturesId : Array,
    problemId : Array,
    analysisResultStaticId : Array
});

// Problem
var problemSchema = mongoose.Schema({
	_id : String,
	lectureId : String,
	description : String,
	studentsId : Array
});

var analysisResultStaticSchema = mongoose.Schema({
	_id : String,
	studentId : String,
	problemId : String,
	totalSequence : Number,
	score : Number,
	url : String,
	path : String,
	dynamicResultsId : Array
});

var analysisResultDynamicSchema = mongoose.Schema({
	_id : String,
	staticId : String,
	row : Number,
	column : Number,
	issueTypes : String
});

// IssueType
var issueTypeSchema =  mongoose.Schema({
	_id : String,
	korean : String,
	english : String,
	toolId : String
});

// AnalysisTool

var analysisToolSchema =  mongoose.Schema({
	_id : String,
	name : String
});



