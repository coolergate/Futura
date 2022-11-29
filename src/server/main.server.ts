//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Startup server

import { Folders } from 'shared/global_resources';
import * as Defined from 'shared/gamedefined';

// Services
const Players = game.GetService('Players');
const DataStoreService = game.GetService('DataStoreService');
const PhysicsService = game.GetService('PhysicsService');
const HttpService = game.GetService('HttpService');
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const Workspace = game.GetService('Workspace');
const StarterGui = game.GetService('StarterGui');

// Create collision groups
PhysicsService.CreateCollisionGroup('GBaseCharacters');
PhysicsService.CreateCollisionGroup('CViewmodels');
PhysicsService.RegisterCollisionGroup('GBaseCharacters');
PhysicsService.RegisterCollisionGroup('CViewmodels');
PhysicsService.CollisionGroupSetCollidable('GBaseCharacters', 'CViewmodels', false);
PhysicsService.CollisionGroupSetCollidable('GBaseCharacters', 'GBaseCharacters', false);
PhysicsService.CollisionGroupSetCollidable('CViewmodels', 'Default', false);

// Workspace folders to ignore before deleting
const Work_Ignore: string[] = ['World', 'Terrain', 'Server', 'Client'];
Workspace.GetChildren().forEach((inst) => {
	if (inst.IsA('Terrain')) return;

	if (inst.Name.sub(1, 1) === '_') {
		inst.Destroy();
		return;
	}

	if (inst.IsA('Folder')) {
		const equivalent_repl = ReplicatedStorage.FindFirstChild(inst.Name);
		if (equivalent_repl) inst.GetChildren().forEach((desc) => (desc.Parent = equivalent_repl));
		if (!Work_Ignore.includes(inst.Name)) inst.Destroy();
	}
});

StarterGui.GetChildren().forEach((inst) => {
	if (inst.IsA('ScreenGui')) {
		inst.Enabled = false;
		inst.Parent = Folders.Storage.UserInterface;
	}
});

// Get server location
interface GameServerFetch {
	status: string;
	country: string;
	countryCode: string;
	region: string;
	regionName: string;
	city: string;
	timezone: string;
	query: string;
}
const ServerGet = HttpService.GetAsync('http://ip-api.com/json/', true);
const ServerFetchedLocation = HttpService.JSONDecode(ServerGet) as GameServerFetch;
let gStringLocation = 'Unknown, Unknown';
ServerFetchedLocation.status === 'success'
	? (gStringLocation = `${ServerFetchedLocation.countryCode}, ${ServerFetchedLocation.regionName}`)
	: (gStringLocation = '??, ??');
Defined.SetServerLocation(gStringLocation);

// Startup scripts
script
	.Parent!.WaitForChild('components')
	.GetDescendants()
	.forEach((inst) => {
		if (inst.IsA('ModuleScript'))
			coroutine.wrap(() => {
				require(inst);
			})();
	});

task.wait(1);
ReplicatedStorage.SetAttribute('Running', true); // gamedefined.ts
