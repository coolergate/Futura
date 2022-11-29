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

declare global {
	type CBaseControllerInfo = {
		Name: string;
		Init(): void;
		Start(): void;
		Update(): void;
	};
}

export class CBaseController implements CBaseControllerInfo {
	Name = 'DefController';
	Init(): void {}
	Start(): void {}
	Update(): void {}
}

export interface Controllers {}
