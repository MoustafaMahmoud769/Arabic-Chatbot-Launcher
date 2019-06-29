
function strip(str)
{
    return str.replace(/^\s+|\s+$/g, '');
}

function is_char(x)
{	
	let a = "a".charCodeAt(0)
	let z = "z".charCodeAt(0)
	let A = "A".charCodeAt(0)
	let Z = "Z".charCodeAt(0)
	let nx = x.charCodeAt(0)

	if(nx >= a && nx <= z) {
		return true;
	}

	if(nx >= A && nx <= Z) {
		return true;
	}

	return false
}

function is_digit(x)
{	
	let a = "0".charCodeAt(0)
	let z = "9".charCodeAt(0)
	let nx = x.charCodeAt(0)

	if(nx >= a && nx <= z) {
		return true;
	}

	return false
}

function is_special_char(x)
{	
	if(x == '!' || x == '@' || x == "#" ||
	   x == '$' || x == '%' || x == "^" ||
	   x == '&' || x == '*' || x == "(" ||
	   x == ')' || x == '_' || x == "-" ||
	   x == '+' || x == '=' || x == "[" ||
	   x == ']' || x == '{' || x == "}" ||
	   x == '\"' || x == '\\' || x == ";" ||
	   x == ':' || x == '?' || x == "<" ||
	   x == '>' || x == '/' || x == "`" ||
	   x == '~' || x == '±' || x == "§") {
		return true
	}
	
	return false
}

function valid_name(str)
{
	for(let i=0; i<str.length; i++) {
		if(!is_char(str[i]) &&
		   !is_digit(str[i]) &&
		   !is_special_char(str[i])) {
			return false;
		}
	}

	return true;
}

module.exports =
{
    strip: strip,
    valid_name: valid_name,
}