var tools = require('../utils/tools')
const path = 'assets/botFiles/stories.json';
var storiesObj = require('../utils/stories_validator')
const fs = require('fs')

/*
	var story = {
		name: arg.storyName,
		examples: arg.storyBody.split('\n'),
	};
*/

function log(test_name) {
	console.log("STORIES: " + test_name + ".");
}

function assert(condition) {
    if (!condition) {
    	console.log("Assertion failed");
    } else {
    	console.log("Assertion succeeded");
    }
}

function read_objects() {
	// return array of intents
	return JSON.parse(fs.readFileSync(path));
}

function test1() {
	//test empty name
	log("Test 1 - empty name");
	var intent = {
		name: "",
		examples: [],
	};
	assert(storiesObj.validateSingleStory(intent).empty == true);
	assert(storiesObj.validateSingleStory(intent).invalid_name == false);
	assert(storiesObj.validateSingleStory(intent).title_existed == false);
	assert(storiesObj.validateSingleStory(intent).invalid == false);
	assert(storiesObj.validateSingleStory(intent).no_action == false);
	assert(storiesObj.validateSingleStory(intent).invalid_intent == false);
	assert(storiesObj.validateSingleStory(intent).invalid_action == false);
	assert(storiesObj.validateSingleStory(intent).invalid_slot == false);
}

function test2() {
	//test invalid story
	log("Test 2 - invalid story");
	var intent = {
		name: tools.generate_random_text(1024),
		examples: [tools.generate_random_text(1024)],
	};
	assert(storiesObj.validateSingleStory(intent).empty == false);
	assert(storiesObj.validateSingleStory(intent).invalid_name == false);
	assert(storiesObj.validateSingleStory(intent).title_existed == false);
	assert(storiesObj.validateSingleStory(intent).invalid == true);
	assert(storiesObj.validateSingleStory(intent).no_action == false);
	assert(storiesObj.validateSingleStory(intent).invalid_intent == false);
	assert(storiesObj.validateSingleStory(intent).invalid_action == false);
	assert(storiesObj.validateSingleStory(intent).invalid_slot == false);
}

function test3() {
	//test invalid intent
	log("Test 3 - invalid intent + valid story + no action");
	var intent = {
		name: tools.generate_random_text(1024),
		examples: ["* " + tools.generate_random_text(1024)],
	};
	assert(storiesObj.validateSingleStory(intent).empty == false);
	assert(storiesObj.validateSingleStory(intent).invalid_name == false);
	assert(storiesObj.validateSingleStory(intent).title_existed == false);
	assert(storiesObj.validateSingleStory(intent).invalid == false);
	assert(storiesObj.validateSingleStory(intent).no_action == true);
	assert(storiesObj.validateSingleStory(intent).invalid_intent == true);
	assert(storiesObj.validateSingleStory(intent).invalid_action == false);
	assert(storiesObj.validateSingleStory(intent).invalid_slot == false);
}

function test4() {
	//test invalid intent
	log("Test 4 - invalid intent + invalid action + valid story");
	var intent = {
		name: tools.generate_random_text(1024),
		examples: ["* " + tools.generate_random_text(1024), "- " + tools.generate_random_text(1024)],
	};
	assert(storiesObj.validateSingleStory(intent).empty == false);
	assert(storiesObj.validateSingleStory(intent).invalid_name == false);
	assert(storiesObj.validateSingleStory(intent).title_existed == false);
	assert(storiesObj.validateSingleStory(intent).invalid == false);
	assert(storiesObj.validateSingleStory(intent).no_action == false);
	assert(storiesObj.validateSingleStory(intent).invalid_intent == true);
	assert(storiesObj.validateSingleStory(intent).invalid_action == true);
	assert(storiesObj.validateSingleStory(intent).invalid_slot == false);
}

function test5() {
	//test invalid intent
	log("Test 5 - invalid intent + invalid action + invalid slot");
	var intent = {
		name: tools.generate_random_text(1024),
		examples: ["* " + tools.generate_random_text(1024), "- " + tools.generate_random_text(1024), "$ " + tools.generate_random_text(1024) + " -> " + tools.generate_random_text(1024)],
	};
	assert(storiesObj.validateSingleStory(intent).empty == false);
	assert(storiesObj.validateSingleStory(intent).invalid_name == false);
	assert(storiesObj.validateSingleStory(intent).title_existed == false);
	assert(storiesObj.validateSingleStory(intent).invalid == false);
	assert(storiesObj.validateSingleStory(intent).no_action == false);
	assert(storiesObj.validateSingleStory(intent).invalid_intent == true);
	assert(storiesObj.validateSingleStory(intent).invalid_action == true);
	assert(storiesObj.validateSingleStory(intent).invalid_slot == true);
}

function run_tests() {
	test1();
	test2();
	test3();
	test4();
	test5();
}

run_tests();