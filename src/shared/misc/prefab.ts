// Author: coolergate#2031
// Purpose:

class Component implements BaseServerComponent {
	constructor() {}
	Start(): void {}
}

export function Init() {
	return new Component();
}
