// Author: coolergate#2031
// Purpose:

import * as Services from '@rbxts/services';

class Component implements BaseServerComponent {
	constructor() {}
	Start(): void {}
}

export function Init() {
	return new Component();
}

export const InitOrder = 0;
