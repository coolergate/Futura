const defaultCharacters = string.split('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', '');
function GenerateString(length = 5, separator = ''): string {
	let final_string = '';

	for (let index = 0; index < length; index++) {
		final_string = final_string + defaultCharacters[math.random(0, length)] + separator;
	}

	return final_string;
}

export = GenerateString;
