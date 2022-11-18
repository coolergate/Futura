type Symbol = typeof symbols[number];

interface Operation {
	kind: 'add' | 'sub';
	amount: number;
}

const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'] as const;

const numbers: { [_ in Symbol]: number } = {
	I: 1,
	IV: 4,
	V: 5,
	IX: 9,
	X: 10,
	XL: 40,
	L: 50,
	XC: 90,
	C: 100,
	CD: 400,
	D: 500,
	CM: 900,
	M: 1000,
};

/**
 * Converts a roman numeral into its number equivalent.
 * @param numeral The roman numerals to convert into numbers
 */
export function parse(numeral: string) {
	assert(type(numeral) === 'string', `Expected string, got ${type(numeral)}.`);

	if (numeral.size() === 0) {
		error('The numeral must contain at least one symbol.', 2);
	}

	const operations = new Array<Operation>();

	for (const symbol of numeral.upper()) {
		if (!(symbol in numbers)) {
			error(`"${symbol}" is not a valid symbol.`, 2);
		}

		const amount = numbers[symbol as Symbol];
		const lastOperation = operations[operations.size() - 1];

		if (lastOperation) {
			const { kind, amount: lastAmount } = lastOperation;

			if (kind === 'add') {
				if (lastAmount < amount) {
					operations.push({ kind: 'sub', amount: lastAmount * 2 });
				}

				operations.push({ kind: 'add', amount });
			}
		} else {
			operations.push({ kind: 'add', amount });
		}
	}

	return operations.reduce((acc, value) => {
		const { kind, amount } = value;

		if (kind === 'add') {
			return acc + amount;
		}

		return acc - amount;
	}, 0);
}

/**
 * Converts a number into its roman numeral equivalent.
 * @param integer The integer to convert into roman numerals
 */
export function toNumeral(integer: number) {
	assert(type(integer) === 'number', `Expected number, got ${type(integer)}.`);

	if (integer < 0.5) {
		error('The integer must be greater than zero.', 2);
	} else if (integer >= 4000) {
		error('Cannot convert numbers greater than 3999.', 2);
	}

	return generateSymbols([], math.round(integer)).join('');
}

function generateSymbols(symbolArray: Array<Symbol>, n: number): Array<Symbol> {
	for (const symbol of symbols) {
		const value = numbers[symbol as Symbol];

		if (n / value >= 1) {
			n -= value;
			symbolArray.push(symbol);

			break;
		}
	}

	if (n > 0) {
		return generateSymbols(symbolArray, n);
	}

	return symbolArray;
}
