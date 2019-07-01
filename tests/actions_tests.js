var tools = require('../utils/tools')
const path = 'assets/botFiles/actions.json';
var actionsObj = require('../utils/actions_validator')
const fs = require('fs')

/*
	var action = {
		name: arg.actionName,
		examples: arg.actionExamples.split('\n'),
		slots: arg.actionSlots.split('\n'),
	};
*/

function log(test_name) {
	console.log("INTENTS: " + test_name + ".");
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
	var action = {
		name: "",
		examples: ["xx"],
		slots: []
	};

	assert(actionsObj.validateSingleAction(action).empty == true);
	assert(actionsObj.validateSingleAction(action).invalid_name == false);
	assert(actionsObj.validateSingleAction(action).title_existed == false);
	assert(actionsObj.validateSingleAction(action).duplications == 0);
	assert(actionsObj.validateSingleAction(action).invalid_slot == false);
}

function test2() {
	//test invalid name
	log("Test 2 - invalid name");
	var action = {
		name: "alice bob",
		examples: ["xx"],
		slots: []
	};

	assert(actionsObj.validateSingleAction(action).empty == false);
	assert(actionsObj.validateSingleAction(action).invalid_name == true);
	assert(actionsObj.validateSingleAction(action).title_existed == false);
	assert(actionsObj.validateSingleAction(action).duplications == 0);
	assert(actionsObj.validateSingleAction(action).invalid_slot == false);
}

function test3() {
	
	let objs = read_objects();
	if(objs.length == 0) {
		return 0;
	}
	
	//test existed name
	log("Test 3 - existed name");

	for(let i=0; i<objs.length; i++) {
		var action = {
			name: objs[i],
			examples: ["xx"],
			slots: []
		};

		assert(actionsObj.validateSingleAction(action).empty == false);
		assert(actionsObj.validateSingleAction(action).invalid_name == false);
		assert(actionsObj.validateSingleAction(action).title_existed == true);
		assert(actionsObj.validateSingleAction(action).duplications == 0);
		assert(actionsObj.validateSingleAction(action).invalid_slot == false);
	}
}

function test4() {
	//test existed name
	log("Test 4 - non existed name");

	for(let i=0; i<8; i++) {
		var action = {
			name: tools.generate_random_text(1024),
			examples: ["xx"],
			slots: []
		};

		assert(actionsObj.validateSingleAction(action).empty == false);
		assert(actionsObj.validateSingleAction(action).invalid_name == false);
		assert(actionsObj.validateSingleAction(action).title_existed == false);
		assert(actionsObj.validateSingleAction(action).duplications == 0);
		assert(actionsObj.validateSingleAction(action).invalid_slot == false);
	}
}

function test5() {
	//test duplications
	log("Test 5 - duplications");
	var action = {
		name: tools.generate_random_text(1024),
		examples: ["xx", "yy", "xx"],
		slots: []
	};

	assert(actionsObj.validateSingleAction(action).empty == false);
	assert(actionsObj.validateSingleAction(action).invalid_name == false);
	assert(actionsObj.validateSingleAction(action).title_existed == false);
	assert(actionsObj.validateSingleAction(action).duplications == 1);
	assert(actionsObj.validateSingleAction(action).invalid_slot == false);
}

function test6() {
	//test invalid slots
	log("Test 6 - invalid slots");

	for(let i=0; i<8; i++) {
		var action = {
			name: tools.generate_random_text(1024),
			examples: ["xx", "yy"],
			slots: [tools.generate_random_text(1024), tools.generate_random_text(1024), tools.generate_random_text(1024)],
		};

		assert(actionsObj.validateSingleAction(action).empty == false);
		assert(actionsObj.validateSingleAction(action).invalid_name == false);
		assert(actionsObj.validateSingleAction(action).title_existed == false);
		assert(actionsObj.validateSingleAction(action).duplications == 0);
		assert(actionsObj.validateSingleAction(action).invalid_slot == true);
	}
}


function run_tests() {
	test1();
	test2();
	test3();
	test4();
	test5();
	test6();
}

run_tests();