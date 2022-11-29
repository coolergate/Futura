//    █████████    █████████    █████████
//   ███░░░░░███  ███░░░░░███  ███░░░░░███
//  ███     ░░░  ███     ░░░  ███     ░░░
// ░███         ░███         ░███
// ░███    █████░███    █████░███
// ░░███  ░░███ ░░███  ░░███ ░░███     ███
//  ░░█████████  ░░█████████  ░░█████████
//   ░░░░░░░░░    ░░░░░░░░░    ░░░░░░░░░
//
// Purpose: Remotes for communication between server and client(s)
const ReplicatedStorage = game.GetService('ReplicatedStorage');
const RunService = game.GetService('RunService');
const Players = game.GetService('Players');

const network_folder =
	(RunService.IsClient() && (ReplicatedStorage.WaitForChild('Network') as Folder)) ||
	(ReplicatedStorage.FindFirstChild('Network') as Folder) ||
	new Instance('Folder', ReplicatedStorage);
network_folder.Name = 'Network';
let next_index = 0;

function Manager(index: number, mode: 'RemoteFunction' | 'RemoteEvent'): RemoteEvent | RemoteFunction {
	let instance = network_folder.FindFirstChild(tostring(index)) as RemoteEvent | RemoteFunction;
	if (RunService.IsClient()) {
		if (instance) return instance;
		else return network_folder.WaitForChild(tostring(index)) as RemoteEvent | RemoteFunction;
	}

	if (!instance) {
		instance = new Instance(mode, network_folder);
		instance.Name = tostring(index);
	}
	return instance;
}

type NetworkMode = 'ClientToServer' | 'ServerToClient';

//=============================================================================
// Remote constructor defined by NetworkMode
//=============================================================================
class Remote<headers extends unknown[]> {
	private Instance: RemoteEvent;
	private NetMode: NetworkMode;

	// * Server
	OnServerPost = undefined as ((user: Player, ...args: headers) => void) | undefined;
	PostClient(users: Player[], ...data: headers) {
		assert(RunService.IsServer(), 'server-side only.' + ' (' + tostring(this.Instance.Name) + ')');
		users.forEach((user) => {
			this.Instance.FireClient(user, ...data);
		});
	}
	PostAllClients(block: Player[] | undefined, ...data: headers) {
		assert(RunService.IsServer(), 'server-side only.' + ' (' + tostring(this.Instance.Name) + ')');
		Players.GetPlayers().forEach((user) => {
			if (block !== undefined && block.includes(user)) return;
			this.Instance.FireClient(user, ...data);
		});
	}

	// * Client
	OnClientPost = undefined as ((...args: headers) => void) | undefined;
	PostServer(...args: headers) {
		assert(RunService.IsServer(), 'client-side only.' + ' (' + tostring(this.Instance.Name) + ')');
		this.Instance.FireServer(...args);
	}

	constructor(NetworkMode: NetworkMode) {
		this.NetMode = NetworkMode;
		this.Instance = Manager(next_index, 'RemoteEvent') as RemoteEvent;
		next_index++;

		if (RunService.IsServer())
			this.Instance.OnServerEvent.Connect((player, ...data) => {
				if (this.NetMode !== 'ClientToServer' || this.OnServerPost === undefined) return;
				this.OnServerPost(player, ...(data as headers));
			});
		else
			this.Instance.OnClientEvent.Connect((...data) => {
				if (this.NetMode !== 'ServerToClient' || this.OnClientPost === undefined) return;
				this.OnClientPost(...(data as headers));
			});
	}
}

class Function<headers extends unknown[], response> {
	private Instance: RemoteFunction;

	// * Server
	OnServerInvoke = undefined as ((user: Player, ...args: headers) => response) | undefined;
	InvokeClient(user: Player, ...data: headers) {
		return new Promise<response>((resolve) => {
			resolve(this.Instance.InvokeClient(user, ...data) as response);
		});
	}

	// * Client
	OnClientInvoke = undefined as ((...args: headers) => response) | undefined;
	InvokeServer(...args: headers) {
		return new Promise<response>((resolve) => {
			resolve(this.Instance.InvokeServer(...args));
		});
	}

	constructor() {
		this.Instance = Manager(next_index, 'RemoteFunction') as RemoteFunction;
		next_index++;

		if (RunService.IsServer())
			this.Instance.OnServerInvoke = function (player, ...data) {
				assert(this.OnServerInvoke, 'OnServerInvoke has not been declared!' + ' (' + tostring(this.Name) + ')');
				return this.OnServerInvoke(player, ...(data as headers)) as response;
			};
		else
			this.Instance.OnClientInvoke = (...data: headers) => {
				assert(
					this.OnClientInvoke,
					'OnClientInvoke has not been declared!' + ' (' + tostring(this.Instance.Name) + ')',
				);
				return this.OnClientInvoke(...(data as headers));
			};
	}
}

const Network = {
	PlayerLogin: new Function<[], void>(),
	PlayerJoined: new Remote<[username: string]>('ServerToClient'),
	PlayerLeft: new Remote<[username: string]>('ServerToClient'),
	PlayerReport: new Remote<[username: string, reason: string]>('ClientToServer'),

	Chat_Send: new Function<[message: string], void>(),
	Chat_Revieve: new Remote<[message: string]>('ServerToClient'),

	Console_SendArg: new Function<[argument: string, value: unknown[]], string | undefined | void>(),
	Console_GetServerArgs: new Function<[], string[]>(),

	Ent_Character_Spawned: new Remote('ServerToClient'),
	Ent_Character_InfoChanged: new Remote<[Info: PlayerEntityInfo_1]>('ServerToClient'),
	Ent_Character_RequestRespawn: new Function<[], PlayerEntityInfo_1 | void>(),
	Ent_Character_GetAll: new Function(),

	// Loading data
	GetInterfaceInfo: new Function<[], [content: ScreenGui[]]>(),
};
export = Network;
