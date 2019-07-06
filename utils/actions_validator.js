var slotsObj = require('./slots_validator')
var tools = require('./tools')
const path = 'assets/botFiles/actions.json';
const fs = require('fs')

function parse_buttons_data(slots)
{
  buttons = []

  if(slots.length < 4) {
    return buttons;
  }

  for (let i=0; i<slots.length; i+=4) {
    new_button = {
      value: slots[i].substring(14),
      slot_name: slots[i+1].substring(11),
      slot_value: slots[i+2].substring(12),
      intent: slots[i+3].substring(17),
    };
    buttons.push(new_button);
  }

  return buttons;
}

function validate_single_button(button)
{
  if(button.value.length == 0) {
    return false;
  }

  if(button.slot_name.length == 0) {
    return false;
  }

  if(button.slot_value.length == 0) {
    return false;
  }

  let slots_rawdata = fs.readFileSync('assets/botFiles/slots.json');
  let slots = JSON.parse(slots_rawdata);
  let invalid_slot = false;
  let invalid_slot_str = "";

  // slot
  let found = false;
  let stored_slot;

  for(let j=0; j<slots.length; j++) {
    if(slots[j].name == button.slot_name) {
      found = true;
      stored_slot = slots[j];
      break;
    }
  }

  if(!found) {
    invalid_slot = true;
    invalid_slot_str = "{" + button.value + ", " + button.slot_name + ", " + button.slot_value + ", " + button.intent + "}";
  } else {
    // validate the type if found
    if(slotsObj.valid_slot_value(stored_slot, button.slot_value) == false) {
      invalid_slot = true;
      invalid_slot_str = "{" + button.value + ", " + button.slot_name + ", " + button.slot_value + ", " + button.intent + "}";
    }
  }

  let intents_rawdata = fs.readFileSync('assets/botFiles/intents.json');
  let intents = JSON.parse(intents_rawdata);
  let invalid_intent = false;
  let invalid_intent_str = "";

  // intent
  let found_intent = false;

  if (button.intent == ''){
    found_intent = true;
  } else {
    for(let j=0; j<intents.length; j++) {
      if(intents[j].name == button.intent) {
        found_intent = true;
        break;
      }
    }
  }

  if(!found_intent) {
    invalid_intent = true;
    invalid_intent_str = "{" + button.value + ", " + button.slot_name + ", " + button.slot_value + "," + button.intent + "}";
  }

  return {
    invalid_slot: invalid_slot,
    invalid_slot_str: invalid_slot_str,
    invalid_intent: invalid_intent,
    invalid_intent_str: invalid_intent_str,
  }
}

function validateSingleAction(action) {

  /**
   * check if name or examples are empty!
   */
   let empty = false;
   if(action.name == '' ||
      action.examples.length == 0) {
    empty = true;
   }

  /**
   * check if valid name or not!
   */
   let invalid_name = !tools.valid_name(action.name);

  /**
   * check for duplications in action examples
   */
   let duplications = 0;
   for(let i=0; i<action.examples.length; i++) {
    for(let j=i+1; j<action.examples.length; j++) {
      if(action.examples[i] == action.examples[j]) {
        duplications++;
      }
    }
   }

   /**
   * verify buttons!
   */
   let invalid_slot = false;
   let invalid_slot_str = "";
   let invalid_intent = false;
   let invalid_intent_str = "";
   let buttons = parse_buttons_data(action.slots)
   for(let i=0; i<buttons.length; i++) {
    let vsb = validate_single_button(buttons[i]);
    if(vsb.invalid_slot == true) {
      invalid_slot = vsb.invalid_slot;
      invalid_slot_str = vsb.invalid_slot_str;
      break;
    }
    if(vsb.invalid_intent == true) {
      invalid_intent = vsb.invalid_intent;
      invalid_intent_str = vsb.invalid_intent_str;
      break;
    }
   }

  /**
   * check for title existed before?
   */
  let actions = JSON.parse(fs.readFileSync(path));
  let title_existed = false;
  actions.forEach(function(old_action, index){
    if(old_action.name == action.name) {
      title_existed = true;
    }
  });

  return {
    empty: empty,
    invalid_name: invalid_name,
    title_existed: title_existed,
    duplications: duplications,
    invalid_slot: invalid_slot,
    invalid_slot_str: invalid_slot_str,
    invalid_intent: invalid_intent,
    invalid_intent_str: invalid_intent_str
  }
}

function findActionError(validation_results, options) {

  if(validation_results.empty == true) {
    return {"title": 'Your action is empty!', "body": "You must provide title and examples of your action!"};
  }

  if(validation_results.invalid_name == true) {
    return {"title": 'Your action name is invalid!', "body": "Your action title must be [a|z] or [A|Z] or digits or special characters."};
  }

  if(validation_results.duplications != 0) {
    return {"title": 'Your action examples have duplications!', "body": "One or more of your action examples is repeated more than once!"};
  }

  if(validation_results.title_existed == true && options['dups'] != false) {
    return {"title": 'Your action title is already existed!', "body": "Please change the action title as it is already existed!"};
  }

  if(validation_results.invalid_slot == true) {
    return {"title": 'Your action has invalid button!', "body": "Please fix this button please! -> " + validation_results.invalid_slot_str};
  }

  if(validation_results.invalid_intent == true) {
    return {"title": 'Your action has invalid intent!', "body": "Please fix this button please! -> " + validation_results.invalid_intent_str};
  }

  return false;
}

module.exports = {
  validateSingleAction: validateSingleAction,
  findActionError: findActionError,
  validate_single_button: validate_single_button,
  parse_buttons_data: parse_buttons_data,
}
