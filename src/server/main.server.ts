// Creator: coolergate#2031
// Purpose: Startup server

import * as Defined from 'shared/gamedefined';
import * as Folders from 'shared/folders';
import Signals from './providers/signals';
import Network from 'shared/network';
import { CVar, CreatedVars, CreatedServerCommands } from 'shared/vars';
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

StarterGui.GetChildren().forEach(inst => {
	if (inst.IsA('ScreenGui')) {
		inst.Enabled = false;
		inst.Parent = Folders.Interface;
	}
});

Workspace.GetChildren().forEach(inst => {
	if (inst.Name.sub(1, 1) === '_' || (!inst.IsA('Folder') && !inst.IsA('Terrain'))) inst.Destroy();
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

Players.PlayerRemoving.Connect(player => {
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

Console_SendArg.OnServerInvoke = (user, content) => {
	// safe checks
	if (
		content.size() === 0 ||
		!content.every(element => {
			return type(element) === 'string';
		})
	)
		return;

	const command = content[0];
	content.remove(0);

	// only accept invokes if the sender is in the playerlist
	const player_data = PlayerMonitors.find(data => {
		return data.UserId === user.UserId;
	});
	if (!player_data) return '[!] Unable to retrieve player data';

	const c_command = CreatedServerCommands.find(cmd => {
		return cmd.name === command;
	});
	if (c_command) return c_command.OnInvoke(player_data, ...content);
};

Console_GetCmds.OnServerInvoke = player => {
	const names: string[] = [];
	CreatedServerCommands.forEach(server_cmd => {
		names.insert(0, server_cmd.name);
	});
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
	Init(): BaseClientComponent;
}
interface ComponentInfo {
	Name: string;
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
		Module: module,
	};
	Components.insert(0, info);
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
