// Author: coolergate#2031
// Reason: Miscellaneous functions

export function num_string_pad(num: number, size: number): string {
	let str_number = tostring(num);
	while (str_number.size() < size) str_number = '0' + str_number;
	return str_number;
}

export class ToggleableSignal<BaseArgs extends unknown[]> {
	private Signal = new Instance('BindableEvent'); //STUB - To be replaced later, it uses too much memory
	private AssignedConnections = new Array<(...args: BaseArgs) => unknown>();

	CanActivate = false;
	Connect(callback: (...args: BaseArgs) => unknown) {
		//this.AssignedConnections.insert(0, callback);
		this.Signal.Event.Connect(callback);
	}

	Activate(...args: BaseArgs) {
		if (this.CanActivate) this.Signal.Fire(...args);
	}
}
