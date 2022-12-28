// Author: coolergate#2031
// Reason: Signals for communicating between scripts

export class LocalSignal<headers extends unknown[]> {
	Connections = new Array<(...args: headers) => unknown>();

	Connect(callback: (...args: headers) => void) {
		this.Connections.insert(0, callback);
	}

	Fire(...args: headers) {
		this.Connections.forEach(callback => {
			coroutine.wrap(() => callback(...args))();
		});
	}
}
export class LocalFunction<headers extends unknown[], response> {
	Handle = undefined as ((...args: headers) => response) | undefined;

	Call(...args: headers) {
		assert(this.Handle, 'LocalFunction Handle callback has not been defined.');
		return this.Handle(...args);
	}
}
