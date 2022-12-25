// Creator: coolergate#2031
// Purpose: Startup server

import * as Defined from 'shared/gamedefined';
import * as Folders from 'shared/folders';
import * as Services from '@rbxts/services';
import Signals from './providers/signals';
import Network from 'shared/network';
import { CVar, CreatedVars } from 'shared/components/vars';
import { created_commands } from './providers/client_cmds';
import { LocalSignal } from 'shared/local_network';

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
		inst.Parent = Folders.Interface;
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

const PlayerMonitors = new Array<PlayerMonitor>();
const cvar_joinlog = new CVar('pl_joinlog', true, '', []);

const PlayerReport = Network.PlayerReport;
const PlayerJoined = Network.PlayerJoined;
const PlayerLogin = Network.PlayerLogin;
const PlayerLeft = Network.PlayerLeft;

const PlayerDataStore = DataStoreService.GetDataStore('PlayerData');
declare global {
	interface PlayerCloudData {
		Username: string;
		Elo: number;
		CustomSettings: Map<string, unknown>;
	}
	interface PlayerMonitor {
		Username: string;
		UserId: number;
		Cloud: PlayerCloudData;
		Instance: Player;

		readonly ConsoleLevel: number;

		OnDisconnect: LocalSignal<[]>;
	}
}
class Monitor implements PlayerMonitor {
	Username: string;
	UserId: number;
	Cloud: PlayerCloudData;
	Instance: Player;
	readonly ConsoleLevel: number;

	OnDisconnect = new LocalSignal();

	constructor(player: Player) {
		this.Cloud = (PlayerDataStore.GetAsync(`player_${player.UserId}`)[0] as PlayerCloudData | undefined) || {
			Username: player.Name,
			Elo: 1000,
			CustomSettings: new Map(),
		};

		this.Username = this.Cloud.Username;
		this.UserId = player.UserId;
		this.ConsoleLevel = 0;
		this.Instance = player;

		PlayerMonitors.insert(0, this);
	}
}

function BuildClassInfo(monitor: Monitor): PlayerMonitor {
	return {
		Username: monitor.Username,
		UserId: monitor.UserId,
		Cloud: monitor.Cloud,
		Instance: monitor.Instance,
		ConsoleLevel: monitor.ConsoleLevel,

		OnDisconnect: monitor.OnDisconnect,
	};
}

Signals.GetDataFromPlayerId.Handle = userid => {
	const monitor = PlayerMonitors.find(PlayerClass => {
		return PlayerClass.UserId === userid;
	});
	return monitor !== undefined ? BuildClassInfo(monitor) : undefined;
};

PlayerLogin.OnServerInvoke = player => {
	const user_is_logged = PlayerMonitors.find(data => {
		if (data.UserId === player.UserId) return true;
	});

	if (user_is_logged !== undefined) {
		player.Kick(' ');
		return;
	}

	const monitor = new Monitor(player);

	Signals.PlayerAdded.Fire(player.UserId, BuildClassInfo(monitor));
	if (cvar_joinlog.value) PlayerJoined.PostAllClients(undefined, monitor.Username);
};

Services.Players.PlayerRemoving.Connect(player => {
	const monitor = PlayerMonitors.find(monitor => {
		return monitor.UserId === player.UserId;
	});
	if (!monitor) return;

	Signals.PlayerRemoved.Fire(player.UserId, BuildClassInfo(monitor));
	if (cvar_joinlog.value) PlayerLeft.PostAllClients([], monitor.Username);
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
	const player_data = PlayerMonitors.find(data => {
		return data.UserId === user.UserId;
	});
	if (!player_data) return '[!] Unable to retrieve player data';

	// legacy support
	const cvar = CreatedVars.find(cvar => {
		return cvar.attributes.has('ClientAccess') && cvar.name === command;
	});
	if (cvar && type(cvar.value) === 'function') {
		const callback = cvar.value as (player: PlayerMonitor, ...args: unknown[]) => string;
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
