//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Game defined fast funtions

const RunService = game.GetService('RunService');
const ReplicatedStorage = game.GetService('ReplicatedStorage');

export function ServerRunning() {
	return ReplicatedStorage.GetAttribute('Running') === true;
}

export function IsConsole() {
	assert(RunService.IsClient(), 'IsConsole Client-Locked');
	return game.GetService('GuiService').IsTenFootInterface();
}

type GameMode = 'Streets' | 'Deathmatch' | 'CaptureTheFlag' | 'Duel';
export function CurrentGMode() {
	return ReplicatedStorage.GetAttribute('GMode') as GameMode | undefined;
}
export function SetGMode(Mode: GameMode) {
	assert(RunService.IsServer(), 'SetGMode Server-Locked');
	ReplicatedStorage.SetAttribute('GMode', Mode);
}

export function GetServerLocation() {
	let location = ReplicatedStorage.GetAttribute('ServerLoc') as string | undefined;
	if (location === undefined) location = '??, ??';
	return location;
}
export function SetServerLocation(location: string) {
	assert(RunService.IsServer(), 'SetServerLocation Server-Locked');
	ReplicatedStorage.SetAttribute('ServerLoc', location);
}
