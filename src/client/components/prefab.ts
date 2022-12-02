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
// * - InitOrder: number'

import * as AllServices from '@rbxts/services';

class Component implements BaseClientComponent {
	Player = AllServices.Players.LocalPlayer;

	constructor() {
		print('component init.');
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
