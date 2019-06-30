var tools = require('./tools')
const path = 'assets/botFiles/slots.json';
const fs = require('fs')

function valid_slot_value(stored_slot, in_slot) {

  //validate if float
  let float_valid = true;
  if(stored_slot.type == "float") {
    // not a float!
    if(!tools.isFloat((in_slot))) {
      float_valid = false;
    } else {
      // max and min value
      let val = parseFloat(in_slot);
      if (val < stored_slot.fmin ||
          val > stored_slot.fmax) {
        float_valid = false;
      }
    }
  }

  //validate if categorical
  let cat_valid = true;
  if(stored_slot.type == "categorical") {
    let temp = false;
    for(let i=0; i<stored_slot.clist.length; i++) {
      if(in_slot == stored_slot.clist[i]) {
        temp = true;
        break;
      }
    }
    cat_valid = temp;
  }

  //validate if boolean
  let bool_valid = true;
  if(stored_slot.type == "bool") {
    if(in_slot.toLowerCase() != "true" &&
      in_slot.toLowerCase() != "false") {
      bool_valid = false;
    }
  }

  return float_valid && cat_valid && bool_valid;
}


function validateSingleSlot(slot) {

  /**
   * check if name or examples are empty!
   */
   let empty = false;
   if(slot.name == '') {
    empty = true;
   }


  /**
   * check if valid name or not!
   */
   let invalid_name = !tools.valid_name(slot.name);

  /**
   * check for title existed before?
   */
  let slots = JSON.parse(fs.readFileSync(path));
  let title_existed = false;
  slots.forEach(function(old_slot, index){
    if(old_slot.name == slot.name) {
      title_existed = true;
    }
  });

  /**
   * check if type not supported!
   */
   let type_error = false;
   if(slot.type != "text" &&
   	  slot.type != "categorical" &&
   	  slot.type != "bool" &&
   	  slot.type != "float" &&
   	  slot.type != "list" &&
   	  slot.type != "unfeaturized") {
   		type_error = true;
   }

  /**
   * check float min & max
   */
   let float_error = false;
   if(slot.type == "float") {
   	  if(!tools.isFloat((slot.fmin)) ||
   	  	 !tools.isFloat((slot.fmax))) {
   	  	float_error = true;
   	  } else {
        if(parseFloat(slot.fmin) > parseFloat(slot.fmax)) {
          float_error = true;
        }
      }
   }

  /**
   * check for duplications/empty in categories
   */
   let categories_duplications = false;
   let categories_empty = false;
   if(slot.type == "categorical") {
   	  if(slot.clist.length == 0) {
   	  	categories_empty = true;
   	  }
	  for(let i=0; i<slot.clist.length; i++) {
	  	for(let j=i+1; j<slot.clist.length; j++) {
	      if(slot.clist[i] == slot.clist[j]) {
            categories_duplications = true;
	      }
      	}
   	  }
   }

  return {
    empty: empty,
    invalid_name: invalid_name,
    title_existed: title_existed,
    type_error: type_error,
    float_error: float_error,
    categories_duplications: categories_duplications,
    categories_empty: categories_empty,
  }
}


function findSlotError(validation_results, options) {

  if(validation_results.empty == true) {
    return {"title": 'Your slot is empty!', "body": "You must provide title to your slot!"};
  }

  if(validation_results.invalid_name == true) {
    return {"title": 'Your slot name is invalid!', "body": "Your slot title must be [a|z] or [A|Z] or digits or special characters."};
  }

  if(validation_results.title_existed == true && options['dups'] != false) {
    return {"title": 'Your slot title is already existed!', "body": "Please change the slot title as it is already existed!"};
  }

  if(validation_results.type_error == true) {
    return {"title": 'Your slot type is not correct!', "body": "Please choose valid slot type!"};
  }

  if(validation_results.float_error == true) {
    return {"title": 'Float values error in the slot!', "body": "Please choose valid float min & max."};
  }

  if(validation_results.categories_duplications == true) {
    return {"title": 'Categories duplication error!', "body": "Some of your categories is duplicated."};
  }

  if(validation_results.categories_empty == true) {
    return {"title": 'Categories empty!', "body": "You must provide some valid categories for your slot."};
  }

  return false;
}


module.exports = {
    validateSingleSlot: validateSingleSlot,
    findSlotError: findSlotError,
    valid_slot_value: valid_slot_value,
}