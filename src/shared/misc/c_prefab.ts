// Author:
// Purpose:

class Component implements BaseClientComponent {
	constructor() {}
	Start(): void {}
	FixedUpdate(): void {}
	Update(delta_time: number): void {}
}

export function Init() {
	return new Component();
}
