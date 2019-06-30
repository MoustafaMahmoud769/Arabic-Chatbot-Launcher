var tools = require('../utils/tools')
const path = 'assets/botFiles/intents.json';
var intentsObj = require('../utils/intents_validator')
const fs = require('fs')

/*
	var intent = {
		name: arg.intentName,
		examples: arg.intentExamples.split('\n'),
		entites: parseEntites(arg.intentEntites, arg.intentExamples.split('\n')),
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
	var intent = {
		name: "",
		examples: ["xx"],
		entites: [],
	};
	assert(intentsObj.validateSingleIntent(intent).empty == true);

	assert(intentsObj.validateSingleIntent(intent).invalid_name == false);
	assert(intentsObj.validateSingleIntent(intent).title_existed == false);
	assert(intentsObj.validateSingleIntent(intent).entity_title_existed == true);
	assert(intentsObj.validateSingleIntent(intent).duplications == 0);
	assert(intentsObj.validateSingleIntent(intent).indices_error == false);
	assert(intentsObj.validateSingleIntent(intent).entity_error == false);
	assert(intentsObj.validateSingleIntent(intent).overlapping_indices == false);
	assert(intentsObj.validateSingleIntent(intent).intent_small_examples == true);
	assert(intentsObj.validateSingleIntent(intent).value_mismatch == false);
}

function test2() {
	//test invalid name
	log("Test 2 - invalid name");
	var intent = {
		name: "ali bob",
		examples: ["xx"],
		entites: [],
	};
	assert(intentsObj.validateSingleIntent(intent).invalid_name == true);

	assert(intentsObj.validateSingleIntent(intent).empty == false);
	assert(intentsObj.validateSingleIntent(intent).title_existed == false);
	assert(intentsObj.validateSingleIntent(intent).entity_title_existed == true);
	assert(intentsObj.validateSingleIntent(intent).duplications == 0);
	assert(intentsObj.validateSingleIntent(intent).indices_error == false);
	assert(intentsObj.validateSingleIntent(intent).entity_error == false);
	assert(intentsObj.validateSingleIntent(intent).overlapping_indices == false);
	assert(intentsObj.validateSingleIntent(intent).intent_small_examples == true);
	assert(intentsObj.validateSingleIntent(intent).value_mismatch == false);
}

function test3() {
	//test valid name
	log("Test 3 - valid name");
	var intent = {
		name: "alibob",
		examples: ["xx"],
		entites: [],
	};
	assert(intentsObj.validateSingleIntent(intent).invalid_name == false);

	assert(intentsObj.validateSingleIntent(intent).empty == false);
	assert(intentsObj.validateSingleIntent(intent).title_existed == false);
	assert(intentsObj.validateSingleIntent(intent).entity_title_existed == true);
	assert(intentsObj.validateSingleIntent(intent).duplications == 0);
	assert(intentsObj.validateSingleIntent(intent).indices_error == false);
	assert(intentsObj.validateSingleIntent(intent).entity_error == false);
	assert(intentsObj.validateSingleIntent(intent).overlapping_indices == false);
	assert(intentsObj.validateSingleIntent(intent).intent_small_examples == true);
	assert(intentsObj.validateSingleIntent(intent).value_mismatch == false);
}

function test4() {
	
	let intents = read_objects();
	if(intents.length == 0) {
		return;
	}

	//test existed name
	log("Test 4 - existed name");
	for(let i=0; i<intents.length; i++) {
		var intent = {
			name: intents[i].name,
			examples: ["xx"],
			entites: [],
		};
		assert(intentsObj.validateSingleIntent(intent).title_existed == true);

		assert(intentsObj.validateSingleIntent(intent).invalid_name == false);
		assert(intentsObj.validateSingleIntent(intent).empty == false);
		assert(intentsObj.validateSingleIntent(intent).entity_title_existed == true);
		assert(intentsObj.validateSingleIntent(intent).duplications == 0);
		assert(intentsObj.validateSingleIntent(intent).indices_error == false);
		assert(intentsObj.validateSingleIntent(intent).entity_error == false);
		assert(intentsObj.validateSingleIntent(intent).overlapping_indices == false);
		assert(intentsObj.validateSingleIntent(intent).intent_small_examples == true);
		assert(intentsObj.validateSingleIntent(intent).value_mismatch == false);
	}
}

function test5() {
	//test non existed name
	log("Test 5 - non existed name");
	for(let i=0; i<8; i++) {
		var intent = {
			name: tools.generate_random_text(1024),
			examples: ["xx"],
			entites: [],
		};
		assert(intentsObj.validateSingleIntent(intent).title_existed == false);

		assert(intentsObj.validateSingleIntent(intent).invalid_name == false);
		assert(intentsObj.validateSingleIntent(intent).empty == false);
		assert(intentsObj.validateSingleIntent(intent).entity_title_existed == true);
		assert(intentsObj.validateSingleIntent(intent).duplications == 0);
		assert(intentsObj.validateSingleIntent(intent).indices_error == false);
		assert(intentsObj.validateSingleIntent(intent).entity_error == false);
		assert(intentsObj.validateSingleIntent(intent).overlapping_indices == false);
		assert(intentsObj.validateSingleIntent(intent).intent_small_examples == true);
		assert(intentsObj.validateSingleIntent(intent).value_mismatch == false);
	}
}

function test6() {
	//test duplications
	log("Test 6 - duplications");
	
	var intent = {
		name: tools.generate_random_text(1024),
		examples: ["xx", "zz", "xx", "yy"],
		entites: [],
	};
	assert(intentsObj.validateSingleIntent(intent).duplications == 1);

	assert(intentsObj.validateSingleIntent(intent).title_existed == false);
	assert(intentsObj.validateSingleIntent(intent).invalid_name == false);
	assert(intentsObj.validateSingleIntent(intent).empty == false);
	assert(intentsObj.validateSingleIntent(intent).entity_title_existed == true);
	assert(intentsObj.validateSingleIntent(intent).indices_error == false);
	assert(intentsObj.validateSingleIntent(intent).entity_error == false);
	assert(intentsObj.validateSingleIntent(intent).overlapping_indices == false);
	assert(intentsObj.validateSingleIntent(intent).intent_small_examples == false);
	assert(intentsObj.validateSingleIntent(intent).value_mismatch == false);
}

function test7() {
	//test duplications
	log("Test 7 - duplications2");
	
	var intent = {
		name: tools.generate_random_text(1024),
		examples: ["xx", "zz", "xx", "yy", "xx", "zz", "yy"],
		entites: [],
	};
	assert(intentsObj.validateSingleIntent(intent).duplications == 4);

	assert(intentsObj.validateSingleIntent(intent).title_existed == false);
	assert(intentsObj.validateSingleIntent(intent).invalid_name == false);
	assert(intentsObj.validateSingleIntent(intent).empty == false);
	assert(intentsObj.validateSingleIntent(intent).entity_title_existed == true);
	assert(intentsObj.validateSingleIntent(intent).indices_error == false);
	assert(intentsObj.validateSingleIntent(intent).entity_error == false);
	assert(intentsObj.validateSingleIntent(intent).overlapping_indices == false);
	assert(intentsObj.validateSingleIntent(intent).intent_small_examples == false);
	assert(intentsObj.validateSingleIntent(intent).value_mismatch == false);
}


function test8() {
	//test duplications
	log("Test 8 - intent small examples");
	tests = [[], ["xx"]]
	for(let i=0; i<tests.length; i++) {
		var intent = {
			name: tools.generate_random_text(1024),
			examples: tests[i],
			entites: [],
		};
		assert(intentsObj.validateSingleIntent(intent).intent_small_examples == true);

		assert(intentsObj.validateSingleIntent(intent).duplications == 0);
		assert(intentsObj.validateSingleIntent(intent).title_existed == false);
		assert(intentsObj.validateSingleIntent(intent).invalid_name == false);
		assert(intentsObj.validateSingleIntent(intent).entity_title_existed == true);
		assert(intentsObj.validateSingleIntent(intent).indices_error == false);
		assert(intentsObj.validateSingleIntent(intent).entity_error == false);
		assert(intentsObj.validateSingleIntent(intent).overlapping_indices == false);
		assert(intentsObj.validateSingleIntent(intent).value_mismatch == false);
	}
}

function test9() {
	//test entity title existed
	log("Test 9 - entity title existed");
	
	var intent = {
		name: tools.generate_random_text(1024),
		examples: ["fares ahmed mohamed"],
		entites: [{from: 0, to: 5, index: 0, name: tools.generate_random_text(1024), value: "fares"}],
	};
	assert(intentsObj.validateSingleIntent(intent).entity_title_existed == false);

	assert(intentsObj.validateSingleIntent(intent).entity_error == false);
	assert(intentsObj.validateSingleIntent(intent).duplications == 0);
	assert(intentsObj.validateSingleIntent(intent).title_existed == false);
	assert(intentsObj.validateSingleIntent(intent).invalid_name == false);
	assert(intentsObj.validateSingleIntent(intent).empty == false);
	assert(intentsObj.validateSingleIntent(intent).indices_error == false);
	assert(intentsObj.validateSingleIntent(intent).overlapping_indices == false);
	assert(intentsObj.validateSingleIntent(intent).intent_small_examples == true);
	assert(intentsObj.validateSingleIntent(intent).value_mismatch == false);
}


function run_tests() {
	test1();
	test2();
	test3();
	test4();
	test5();
	test6();
	test7();
	test8();
	test9();
}

run_tests();