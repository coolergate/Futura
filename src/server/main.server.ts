// Creator: coolergate#2031
// Purpose: Startup server

import * as Defined from 'shared/gamedefined';
import * as Folders from 'shared/folders';
import * as Services from '@rbxts/services';
import Signals from './providers/signals';
import Network from 'shared/network';
import { ConVar, CreatedVars } from 'shared/components/vars';
import { created_commands } from './providers/client_cmds';

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

StarterGui.GetChildren().forEach(inst => {
	if (inst.IsA('ScreenGui')) {
		inst.Enabled = false;
		inst.Parent = Folders.Storage.Interface;
	}
});

//====================================================================
// Server location
//====================================================================
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

//====================================================================
// Player management
//====================================================================
declare global {
	// used by other scripts
	interface PlayerData {
		Username: string;
		UserId: number;
		Elo: number;
	}
	interface PlayerCloudData {
		Username: string;
		Elo: number;
		CustomSettings: Map<string, unknown>;
	}
	interface PlayerData_Advanced extends PlayerData {
		CloudData: PlayerCloudData;
		ConsoleLevel: number;
	}
}

const player_ids = new Array<PlayerData_Advanced>();
const plr_joinlog = new ConVar('pl_joinlog', 1, '', []);

const PlayerReport = Network.PlayerReport;
const PlayerJoined = Network.PlayerJoined;
const PlayerLogin = Network.PlayerLogin;
const PlayerLeft = Network.PlayerLeft;

const PlayerDataStore = DataStoreService.GetDataStore('PlayerData');

function BuildPlayerDataFromAdvanced(data: PlayerData_Advanced) {
	return {
		Username: data.Username,
		UserId: data.UserId,
		Elo: data.Elo,
	} as PlayerData;
}

function GetDataFromUserId(userid: number): PlayerData_Advanced | undefined {
	return player_ids.find((v, i) => {
		return v.UserId === userid;
	});
}

PlayerLogin.OnServerInvoke = player => {
	const user_is_logged = player_ids.find(data => {
		if (data.UserId === player.UserId) return true;
	});

	if (user_is_logged !== undefined) {
		player.Kick(' ');
		return;
	}

	let datastore_data = PlayerDataStore.GetAsync(`player_${player.UserId}`)[0] as PlayerCloudData | undefined;
	if (datastore_data === undefined)
		datastore_data = {
			Username: player.Name,
			Elo: 1000,
			CustomSettings: new Map(),
		};

	// local data
	const advanced_data: PlayerData_Advanced = {
		Username: datastore_data.Username,
		UserId: player.UserId,
		Elo: datastore_data.Elo,
		CloudData: datastore_data,
		ConsoleLevel: 0,
	};

	player_ids.insert(0, advanced_data);
	Signals.PlayerAdded.Fire(player.UserId, BuildPlayerDataFromAdvanced(advanced_data));
	if (plr_joinlog.value === 1) PlayerJoined.PostAllClients(undefined, advanced_data.Username);
};

Services.Players.PlayerRemoving.Connect(player => {
	const data = GetDataFromUserId(player.UserId);
	if (!data) return;

	Signals.PlayerRemoved.Fire(player.UserId, BuildPlayerDataFromAdvanced(data));
	if (plr_joinlog.value === 1) PlayerLeft.PostAllClients([], data.Username);
});

//====================================================================
// Console
//====================================================================

const Console_GetCmds = Network.console_getcmds;
const Console_SendArg = Network.console_sendarg;
const Chat_Recieve = Network.Chat_Revieve;
const Chat_Send = Network.Chat_Send;

Console_SendArg.OnServerInvoke = (user, command, args) => {
	if (command === undefined || args === undefined) return;

	// only accept invokes if the sender is in the playerlist
	const player_data = player_ids.find(data => {
		return data.UserId === user.UserId;
	});
	if (!player_data) return '[!] Unable to retrieve player data';

	// legacy support
	const cvar = CreatedVars.find(cvar => {
		return cvar.attributes.has('ClientAccess') && cvar.name === command;
	});
	if (cvar && type(cvar.value) === 'function') {
		const callback = cvar.value as (player: PlayerData_Advanced, ...args: unknown[]) => string;
		return callback(player_data, ...args);
	}

	const c_command = created_commands.find(cmd => {
		return cmd.name === command;
	});
	if (c_command) return c_command.callback(player_data, args);
};

Console_GetCmds.OnServerInvoke = player => {
	const names: string[] = [];
	CreatedVars.forEach(cvar => {
		if (cvar.attributes.has('ClientAccess')) names.insert(0, cvar.name);
	});
	created_commands.forEach(cmd => names.insert(0, cmd.name));
	return names;
};

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

const Folder = ServerScriptService.WaitForChild('TS').WaitForChild('components') as Folder;
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

// TODO Create & manage folders

task.wait(1);
ReplicatedStorage.SetAttribute('Running', true); // gamedefined.ts
