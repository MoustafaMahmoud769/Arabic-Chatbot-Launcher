var slotsObj = require('./slots')
var actionsObj = require('./actions')
var intentsObj = require('./intents')
var entitiesObj = require('./entites')
var storiesObj = require('./stories')
var tools = require('./tools')
const fs = require('fs')

const actions_path = 'assets/botFiles/actions.json';
const intents_path = 'assets/botFiles/intents.json';
const entities_path = 'assets/botFiles/entites.json';
const stories_path = 'assets/botFiles/stories.json';
const slots_path = 'assets/botFiles/slots.json';

function full_validation() {
	let errors = []

	// validate entities
	let entities = JSON.parse(fs.readFileSync(entities_path));
	for(let i=0; i<entities.length; i++) {
		let validation_results = entitiesObj.validateSingleEntity(entities[i]);
  		let error = entitiesObj.findEntityError(validation_results, {"dups": false});
  		if(error != false) {
  			errors.push(error);
  		}
	}

	//validate actions
	let actions = JSON.parse(fs.readFileSync(actions_path));
	for(let i=0; i<actions.length; i++) {
		let validation_results = actionsObj.validateSingleAction(actions[i]);
  		let error = actionsObj.findActionError(validation_results, {"dups": false});
  		if(error != false) {
  			errors.push(error);
  		}
	}

	//validate intents
	let intents = JSON.parse(fs.readFileSync(intents_path));
	for(let i=0; i<intents.length; i++) {
		let validation_results = intentsObj.validateSingleIntent(intents[i]);
  		let error = intentsObj.findIntentError(validation_results, {"dups": false});
  		if(error != false) {
  			errors.push(error);
  		}
	}

	//validate slots
	let slots = JSON.parse(fs.readFileSync(slots_path));
	for(let i=0; i<slots.length; i++) {
		let validation_results = slotsObj.validateSingleSlot(slots[i]);
  		let error = slotsObj.findSlotError(validation_results, {"dups": false});
  		if(error != false) {
  			errors.push(error);
  		}
	}

	//Number of total intents should be at least 2
	if(intents.length < 2) {
		errors.push({"title": 'Your intents are tiny!', "body": "You must provide at least two intents!"});
	}

	//validate stories
	let stories = JSON.parse(fs.readFileSync(stories_path));
	for(let i=0; i<stories.length; i++) {
		let validation_results = storiesObj.validateSingleStory(stories[i]);
  		let error = storiesObj.findStoryError(validation_results, {"dups": false});
  		if(error != false) {
  			errors.push(error);
  		}
	}

	return errors;
}

function full_conversion() {

	// full validation first!
	if(full_validation().length != 0) {
		return false;
	}

	let data = {}
	data.stories = []
	data.rasa_nlu_data = {}
	data.rasa_nlu_data.common_examples = []
	data.rasa_nlu_data.regex_features = []
	data.rasa_nlu_data.lookup_tables = []
	data.rasa_nlu_data.entity_synonyms = []
	data.actions = {}

	// do stories
	let stories = JSON.parse(fs.readFileSync(stories_path));
	for(let i=0; i<stories.length; i++) {
		let current_story = []
		for(let j=0; j<stories[i].examples.length; j++) {
			let example = stories[i].examples[j];
			if(example[0] == '*') {
				let int = tools.strip(example.substr(1, example.length));
				current_story.push({"intent": int})
			} else if(example[0] == '-') {
				let act = tools.strip(example.substr(1, example.length));
				current_story.push({"action": act})
			}
		}
		data.stories.push(current_story)
	}

	// do actions
	let actions = JSON.parse(fs.readFileSync(actions_path));
	for(let i=0; i<actions.length; i++) {
		let current_action = []
		for(let j=0; j<actions[i].examples.length; j++) {
			current_action.push(actions[i].examples[j]);
		}
		data.actions[actions[i]['name']] = current_action;
	}

	// do intents & entities
	let intents = JSON.parse(fs.readFileSync(intents_path));

	// process every intent alone
	for(let i=0; i<intents.length; i++) {

		// load all entities first
		let entities = {}
		for(let j=0; j<intents[i].entites.length; j++) {
			let ent = intents[i].entites[j];
			if(ent['index'] in entities) {
				entities[ent['index']].push(ent)
			} else {
				entities[ent['index']] = []
				entities[ent['index']].push(ent)
			}
		}

		// create an entry for each intent example
		for(let j=0; j<intents[i].examples.length; j++) {
			let example = intents[i].examples[j];
			// create the intent-example
			let intent_example = {}
			intent_example['intent'] = intents[i]['name'];
			intent_example['text'] = example;
			// set entities if found
			if (j in entities) {
				intent_example['entities'] = []
				for (let k=0; k<entities[j].length; k++) {
					let entity = entities[j][k];
					intent_example['entities'].push({
			            "start": entity['from'],
			            "end": entity['to'],
			            "value": example.substr(entity['from'], entity['to']),
			            "entity": entity['name']
			          });
				}
			}
			data.rasa_nlu_data.common_examples.push(intent_example);
		}

	}

	// data to be written to Marwan file
	return JSON.stringify(data)
}

module.exports = {
    full_validation: full_validation,
    full_conversion: full_conversion,
}
