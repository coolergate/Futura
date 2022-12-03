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
const ServerScriptService = game.GetService('ServerScriptService');
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const DataStoreService = game.GetService('DataStoreService');
const PhysicsService = game.GetService('PhysicsService');
const HttpService = game.GetService('HttpService');
const StarterGui = game.GetService('StarterGui');
const Workspace = game.GetService('Workspace');
const Players = game.GetService('Players');

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
Workspace.GetChildren().forEach(inst => {
	if (inst.IsA('Terrain')) return;

	if (inst.Name.sub(1, 1) === '_') {
		inst.Destroy();
		return;
	}

	if (inst.IsA('Folder')) {
		const equivalent_repl = ReplicatedStorage.FindFirstChild(inst.Name);
		if (equivalent_repl) inst.GetChildren().forEach(desc => (desc.Parent = equivalent_repl));
		if (!Work_Ignore.includes(inst.Name)) inst.Destroy();
	}
});

StarterGui.GetChildren().forEach(inst => {
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
declare global {
	interface BaseServerComponent {
		/**
		 * Called in sync with other scripts
		 */
		Start(): void;
	}
}
interface BaseComponentBuilder {
	InitOrder: number;
	Init(): BaseClientComponent;
}
interface ComponentInfo {
	Name: string;
	InitOrder: number;
	Module: BaseComponentBuilder;
}

const Folder = ServerScriptService.WaitForChild('components') as Folder;
const Components = new Array<ComponentInfo>();
const BuiltComponents = new Array<BaseServerComponent>();

Folder.GetChildren().forEach(inst => {
	if (!inst.IsA('ModuleScript')) return;
	const module = require(inst) as BaseComponentBuilder;
	const info: ComponentInfo = {
		Name: inst.Name,
		InitOrder: module.InitOrder,
		Module: module,
	};
	Components.insert(0, info);
});
Components.sort((a, b) => {
	return a.InitOrder < b.InitOrder;
});

// Init
Components.forEach(v => {
	const build = v.Module.Init();
	BuiltComponents.insert(0, build);
});
BuiltComponents.forEach(component => coroutine.wrap(() => component.Start())());

task.wait(1);
ReplicatedStorage.SetAttribute('Running', true); // gamedefined.ts
