//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Signals for communicating between scripts

export class LocalSignal<headers extends unknown[]> {
	private Instance = new Instance('BindableEvent');

	Connect(callback: (...args: headers) => void) {
		this.Instance.Event.Connect(callback);
	}

	Fire(...args: headers) {
		this.Instance.Fire(...args);
	}
}
export class LocalFunction<headers extends unknown[], response> {
	private Instance = new Instance('BindableFunction');

	Handle = undefined as ((...args: headers) => response) | undefined;

	Call(...args: headers) {
		assert(this.Handle, 'LocalFunction Handle callback has not been defined.');
		return new Promise<response>(resolve => {
			resolve(this.Handle!(...args));
		});
	}
}
