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

function full_validation() {
	errors = []

	// validate entities
	let entities = JSON.parse(fs.readFileSync(entities_path));
	for(var i=0; i<entities.length; i++) {
		validation_results = entitiesObj.validateSingleEntity(entities[i]);
  		error = entitiesObj.findEntityError(validation_results, {"dups": false});
  		if(error != false) {
  			errors.push(error);
  		}
	}

	//validate actions
	let actions = JSON.parse(fs.readFileSync(actions_path));
	for(var i=0; i<actions.length; i++) {
		validation_results = actionsObj.validateSingleAction(actions[i]);
  		error = actionsObj.findActionError(validation_results, {"dups": false});
  		if(error != false) {
  			errors.push(error);
  		}
	}

	//validate intents
	let intents = JSON.parse(fs.readFileSync(intents_path));
	for(var i=0; i<intents.length; i++) {
		validation_results = intentsObj.validateSingleIntent(intents[i]);
  		error = intentsObj.findIntentError(validation_results, {"dups": false});
  		if(error != false) {
  			errors.push(error);
  		}
	}

	//validate stories
	let stories = JSON.parse(fs.readFileSync(stories_path));
	for(var i=0; i<stories.length; i++) {
		validation_results = storiesObj.validateSingleStory(stories[i]);
  		error = storiesObj.findStoryError(validation_results, {"dups": false});
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

	data = {}
	data.stories = []
	data.rasa_nlu_data = {}
	data.rasa_nlu_data.common_examples = []
	data.rasa_nlu_data.regex_features = []
	data.rasa_nlu_data.lookup_tables = []
	data.rasa_nlu_data.entity_synonyms = []
	data.actions = {}

	// do stories
	let stories = JSON.parse(fs.readFileSync(stories_path));
	for(i=0; i<stories.length; i++) {
		current_story = []
		for(j=0; j<stories[i].examples.length; j++) {
			example = stories[i].examples[j];
			if(example[0] == '*') {
				int = tools.strip(example.substr(1, example.length));
				current_story.push({"intent": int})
			} else {
				act = tools.strip(example.substr(1, example.length));
				current_story.push({"action": act})
			}
		}
		data.stories.push(current_story)
	}

	// do actions
	let actions = JSON.parse(fs.readFileSync(actions_path));
	for(i=0; i<actions.length; i++) {
		current_action = []
		for(j=0; j<actions[i].examples.length; j++) {
			current_action.push(actions[i].examples[j]);
		}
		data.actions[actions[i]['name']] = current_action;
	}

	// do intents & entities
	let intents = JSON.parse(fs.readFileSync(intents_path));

	// process every intent alone
	for(i=0; i<intents.length; i++) {

		// load all entities first
		entities = {}
		for(j=0; j<intents[i].entites.length; j++) {
			ent = intents[i].entites[j];
			if(ent['index'] in entities) {
				entities[ent['index']].push(ent)
			} else {
				entities[ent['index']] = []
				entities[ent['index']].push(ent)
			}
		}

		// create an entry for each intent example
		for(j=0; j<intents[i].examples.length; j++) {
			example = intents[i].examples[j];
			// create the intent-example
			intent_example = {}
			intent_example['intent'] = intents[i]['name'];
			intent_example['text'] = example;
			// set entities if found
			if (j in entities) {
				intent_example['entities'] = []
				for (k=0; k<entities[j].length; k++) {
					entity = entities[j][k];
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
