// Creator: coolergate#2031
// Purpose: Miscellaneous functions

export function num_string_pad(num: number, size: number): string {
	let str_number = tostring(num);
	while (str_number.size() < size) str_number = '0' + str_number;
	return str_number;
}
