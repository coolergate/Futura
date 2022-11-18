import { Folders } from 'shared/global_resources';

// Services
const Players = game.GetService('Players');
const DataStoreService = game.GetService('DataStoreService');
const PhysicsService = game.GetService('PhysicsService');
const HttpService = game.GetService('HttpService');
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const Workspace = game.GetService('Workspace');
const StarterGui = game.GetService('StarterGui');

PhysicsService.CreateCollisionGroup('GBaseCharacters');
PhysicsService.RegisterCollisionGroup('GBaseCharacters');
PhysicsService.CreateCollisionGroup('CViewmodels');
PhysicsService.RegisterCollisionGroup('CViewmodels');

PhysicsService.CollisionGroupSetCollidable('GBaseCharacters', 'CViewmodels', false);
PhysicsService.CollisionGroupSetCollidable('GBaseCharacters', 'GBaseCharacters', false);
PhysicsService.CollisionGroupSetCollidable('CViewmodels', 'Default', false);

StarterGui.GetChildren().forEach((inst) => {
	if (inst.IsA('ScreenGui')) {
		inst.Enabled = false;
		inst.Parent = Folders.Storage.UserInterface;
	}
});

Workspace.GetChildren().forEach((inst) => {
	if (inst.IsA('Terrain')) return;
	if (inst.Name.sub(1, 1) === '_' || !inst.IsA('Folder')) {
		inst.Destroy();
		return;
	}

	if (ReplicatedStorage.FindFirstChild(inst.Name)) {
		const folder = ReplicatedStorage.FindFirstChild(inst.Name)!;
		inst.GetChildren().forEach((inst) => {
			inst.Parent = folder;
		});
	}
});

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
if (ServerFetchedLocation.status === 'success') {
	gStringLocation = `${ServerFetchedLocation.countryCode}, ${ServerFetchedLocation.regionName}`;
} else {
	warn(`IP Fetch replied with "${ServerFetchedLocation.status}"`);
}
ReplicatedStorage.SetAttribute('Region', gStringLocation);

game.GetService('ServerScriptService')
	.GetDescendants()
	.forEach((inst) => {
		if (inst.IsA('ModuleScript')) {
			require(inst);
		}
	});

task.wait(3);
ReplicatedStorage.SetAttribute('Ready', true);
