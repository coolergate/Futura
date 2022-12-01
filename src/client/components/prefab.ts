//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose:
//
// * Required parameters:
// * - Init(): BaseClientComponent
// * - InitOrder: number

class Component implements BaseClientComponent {
	constructor() {
		print('component init');
	}
	Start(): void {
		print('component start.');
	}
	Update(): void {}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
