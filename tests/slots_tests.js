var tools = require('../utils/tools')
const path = 'assets/botFiles/slots.json';
var slotsObj = require('../utils/slots_validator')
const fs = require('fs')

/*
	var slot = {
		name: arg.slotName,
		type: arg.slotType,
		fmin: arg.floatMin,
		fmax: arg.floatMax,
		clist: arg.catList.split('\n')
	};
*/

function log(test_name) {
	console.log("SLOTS: " + test_name + ".");
}

function assert(condition) {
    if (!condition) {
    	console.log("Assertion failed");
    } else {
    	console.log("Assertion succeeded");
    }
}

function read_objects() {
	// return array of slot
	return JSON.parse(fs.readFileSync(path));
}

function test1() {
	//test empty name
	log("Test 1 - empty name");
	let slot = {
		name: "",
		type: "text",
		fmin: "",
		fmax: "",
		clist: []
	};
	assert(slotsObj.validateSingleSlot(slot).empty == true);

	assert(slotsObj.validateSingleSlot(slot).title_existed == false);
	assert(slotsObj.validateSingleSlot(slot).type_error == false);
	assert(slotsObj.validateSingleSlot(slot).float_error == false);
	assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
	assert(slotsObj.validateSingleSlot(slot).categories_empty == false);
}

function test2() {
	//test invalid name
	log("Test 2 - invalid name");
	let slot = {
		name: "alice bob",
		type: "text",
		fmin: "",
		fmax: "",
		clist: []
	};
	assert(slotsObj.validateSingleSlot(slot).invalid_name == true);

	assert(slotsObj.validateSingleSlot(slot).empty == false);
	assert(slotsObj.validateSingleSlot(slot).title_existed == false);
	assert(slotsObj.validateSingleSlot(slot).type_error == false);
	assert(slotsObj.validateSingleSlot(slot).float_error == false);
	assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
	assert(slotsObj.validateSingleSlot(slot).categories_empty == false);
}

function test3() {
	//test valid name
	log("Test 3 - valid name");
	let slot = {
		name: "name##",
		type: "text",
		fmin: "",
		fmax: "",
		clist: []
	};
	assert(slotsObj.validateSingleSlot(slot).invalid_name == false);

	assert(slotsObj.validateSingleSlot(slot).empty == false);
	assert(slotsObj.validateSingleSlot(slot).title_existed == false);
	assert(slotsObj.validateSingleSlot(slot).type_error == false);
	assert(slotsObj.validateSingleSlot(slot).float_error == false);
	assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
	assert(slotsObj.validateSingleSlot(slot).categories_empty == false);
}

function test4() {
	
	objects = read_objects()
	if(objects.length == 0) {
		return;
	}

	//test title existed
	log("Test 4 - title existed");
	for (let i=0; i<objects.length; i++) {
		let slot = {
			name: objects[i].name,
			type: "text",
			fmin: "",
			fmax: "",
			clist: []
		};
		assert(slotsObj.validateSingleSlot(slot).title_existed == true);

		assert(slotsObj.validateSingleSlot(slot).invalid_name == false);
		assert(slotsObj.validateSingleSlot(slot).empty == false);
		assert(slotsObj.validateSingleSlot(slot).type_error == false);
		assert(slotsObj.validateSingleSlot(slot).float_error == false);
		assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
		assert(slotsObj.validateSingleSlot(slot).categories_empty == false);
	}
}

function test5() {
	//test title not existed
	log("Test 5 - title not existed");
	for(let i=0; i<8; i++) {
		let slot = {
			name: tools.generate_random_text(1024),
			type: "text",
			fmin: "",
			fmax: "",
			clist: []
		};
		assert(slotsObj.validateSingleSlot(slot).title_existed == false);

		assert(slotsObj.validateSingleSlot(slot).invalid_name == false);
		assert(slotsObj.validateSingleSlot(slot).empty == false);
		assert(slotsObj.validateSingleSlot(slot).type_error == false);
		assert(slotsObj.validateSingleSlot(slot).float_error == false);
		assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
		assert(slotsObj.validateSingleSlot(slot).categories_empty == false);
	}
}

function test6() {
	//test type error
	log("Test 6 - type error");
	let slot = {
		name: "valid_name",
		type: "wrong_type",
		fmin: "",
		fmax: "",
		clist: []
	};
	assert(slotsObj.validateSingleSlot(slot).type_error == true);

	assert(slotsObj.validateSingleSlot(slot).invalid_name == false);
	assert(slotsObj.validateSingleSlot(slot).empty == false);
	assert(slotsObj.validateSingleSlot(slot).float_error == false);
	assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
	assert(slotsObj.validateSingleSlot(slot).categories_empty == false);
}

function test7() {
	//test valid types
	vtypes = ["text", "categorical", "bool", "float", "list", "unfeaturized"];
	log("Test 7 - valid types");
	for(let i=0; i<vtypes.length; i++) {
		let slot = {
			name: "valid_name",
			type: vtypes[i],
			fmin: "-1",
			fmax: "1",
			clist: ["xx"]
		};
		assert(slotsObj.validateSingleSlot(slot).type_error == false);

		assert(slotsObj.validateSingleSlot(slot).invalid_name == false);
		assert(slotsObj.validateSingleSlot(slot).empty == false);
		assert(slotsObj.validateSingleSlot(slot).float_error == false);
		assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
		assert(slotsObj.validateSingleSlot(slot).categories_empty == false);
	}
}

function test8() {
	//test float errors
	tests = [["sa", "sd"], ["qw", 15], [44, "rr"], ["44b", "55"], [50, 10]];
	log("Test 8 - float errors");
	for(let i=0; i<tests.length; i++) {
		let slot = {
			name: "valid_name",
			type: "float",
			fmin: tests[i][0],
			fmax: tests[i][1],
			clist: []
		};
		assert(slotsObj.validateSingleSlot(slot).float_error == true);

		assert(slotsObj.validateSingleSlot(slot).invalid_name == false);
		assert(slotsObj.validateSingleSlot(slot).empty == false);
		assert(slotsObj.validateSingleSlot(slot).type_error == false);
		assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
		assert(slotsObj.validateSingleSlot(slot).categories_empty == false);
	}
}

function test9() {
	//test float correctness
	tests = [[-15, 15], [0, 15], [5.5, 12.001], [5, 5.00001]];
	log("Test 9 - float correctness");
	for(let i=0; i<tests.length; i++) {
		let slot = {
			name: "valid_name",
			type: "float",
			fmin: tests[i][0],
			fmax: tests[i][1],
			clist: []
		};
		assert(slotsObj.validateSingleSlot(slot).float_error == false);

		assert(slotsObj.validateSingleSlot(slot).invalid_name == false);
		assert(slotsObj.validateSingleSlot(slot).empty == false);
		assert(slotsObj.validateSingleSlot(slot).type_error == false);
		assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
		assert(slotsObj.validateSingleSlot(slot).categories_empty == false);
	}
}

function test10() {
	//test empty categories
	log("Test 10 - empty categories");
	let slot = {
		name: "valid_name",
		type: "categorical",
		fmin: "",
		fmax: "",
		clist: []
	};
	assert(slotsObj.validateSingleSlot(slot).categories_empty == true);
	assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);

	assert(slotsObj.validateSingleSlot(slot).invalid_name == false);
	assert(slotsObj.validateSingleSlot(slot).empty == false);
	assert(slotsObj.validateSingleSlot(slot).type_error == false);
	assert(slotsObj.validateSingleSlot(slot).float_error == false);
}

function test11() {
	//test categories duplication
	log("Test 11 - categories duplication");
	let slot = {
		name: "valid_name",
		type: "categorical",
		fmin: "",
		fmax: "",
		clist: ["xx", "yy", "zz", "xx"]
	};
	assert(slotsObj.validateSingleSlot(slot).categories_duplications == true);
	assert(slotsObj.validateSingleSlot(slot).categories_empty == false);

	assert(slotsObj.validateSingleSlot(slot).invalid_name == false);
	assert(slotsObj.validateSingleSlot(slot).empty == false);
	assert(slotsObj.validateSingleSlot(slot).type_error == false);
	assert(slotsObj.validateSingleSlot(slot).float_error == false);
}

function test12() {
	//test categories correctness
	log("Test 12 - categories correctness");
	let slot = {
		name: "valid_name",
		type: "categorical",
		fmin: "",
		fmax: "",
		clist: ["xx", "yy", "zz"]
	};
	assert(slotsObj.validateSingleSlot(slot).categories_duplications == false);
	assert(slotsObj.validateSingleSlot(slot).categories_empty == false);

	assert(slotsObj.validateSingleSlot(slot).invalid_name == false);
	assert(slotsObj.validateSingleSlot(slot).empty == false);
	assert(slotsObj.validateSingleSlot(slot).type_error == false);
	assert(slotsObj.validateSingleSlot(slot).float_error == false);
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
	test10();
	test11();
	test12();
}

run_tests();