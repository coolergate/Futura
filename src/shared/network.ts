// Creator: coolergate#2031
// Purpose: Remotes for communication between server and client(s)

import * as Services from '@rbxts/services';
import * as Folders from 'shared/folders';

const network_folder = Folders.Network;
let next_index = 0;

function Manager(index: number, mode: 'RemoteFunction' | 'RemoteEvent'): RemoteEvent | RemoteFunction {
	let instance = network_folder.FindFirstChild(tostring(index)) as RemoteEvent | RemoteFunction;
	if (Services.RunService.IsClient()) {
		if (instance) return instance;
		else return network_folder.WaitForChild(tostring(index)) as RemoteEvent | RemoteFunction;
	}

	if (!instance) {
		instance = new Instance(mode, network_folder);
		instance.Name = tostring(index);
	}
	return instance;
}

//=============================================================================
// Remote constructor defined by NetworkMode
//=============================================================================
class Remote<headers extends unknown[]> {
	private Instance: RemoteEvent;

	// * Server
	OnServerPost = undefined as ((user: Player, ...args: headers) => void) | undefined;
	PostClient(users: Player[], ...data: headers) {
		assert(Services.RunService.IsServer(), 'server-side only.' + ' (' + tostring(this.Instance.Name) + ')');
		users.forEach(user => {
			this.Instance.FireClient(user, ...data);
		});
	}
	PostAllClients(block: Player[] | undefined, ...data: headers) {
		assert(Services.RunService.IsServer(), 'server-side only.' + ' (' + tostring(this.Instance.Name) + ')');
		Services.Players.GetPlayers().forEach(user => {
			if (block !== undefined && block.includes(user)) return;
			this.Instance.FireClient(user, ...data);
		});
	}

	// * Client
	OnClientPost = undefined as ((...args: headers) => void) | undefined;
	PostServer(...args: headers) {
		assert(Services.RunService.IsServer(), 'client-side only.' + ' (' + tostring(this.Instance.Name) + ')');
		this.Instance.FireServer(...args);
	}

	constructor() {
		this.Instance = Manager(next_index, 'RemoteEvent') as RemoteEvent;
		next_index++;

		if (Services.RunService.IsServer())
			this.Instance.OnServerEvent.Connect((player, ...data) => {
				if (this.OnServerPost !== undefined) this.OnServerPost(player, ...(data as headers));
			});
		else
			this.Instance.OnClientEvent.Connect((...data) => {
				if (this.OnClientPost !== undefined) this.OnClientPost(...(data as headers));
			});
	}
}

class Function<headers extends unknown[], response> {
	private Instance: RemoteFunction;

	// * Server
	OnServerInvoke = undefined as ((user: Player, ...args: headers) => response) | undefined;
	InvokeClient(user: Player, ...data: headers) {
		return new Promise<response>(resolve => {
			resolve(this.Instance.InvokeClient(user, ...data) as response);
		});
	}

	// * Client
	OnClientInvoke = undefined as ((...args: headers) => response) | undefined;
	InvokeServer(...args: headers) {
		return new Promise<response>(resolve => {
			resolve(this.Instance.InvokeServer(...args));
		});
	}

	constructor() {
		this.Instance = Manager(next_index, 'RemoteFunction') as RemoteFunction;
		next_index++;

		if (Services.RunService.IsServer())
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
	PlayerJoined: new Remote<[username: string]>(),
	PlayerLeft: new Remote<[username: string]>(),
	PlayerReport: new Remote<[username: string, reason: string]>(),

	Chat_Send: new Function<[message: string], void>(),
	Chat_Revieve: new Remote<[message: string]>(),

	// console
	console_sendarg: new Function<[content: string[]], string | void>(),
	console_getcmds: new Function<[], string[]>(),

	// entities
	entities: {
		ent_Character: {
			info_changed: new Remote<[Info: CharacterLocalInfo]>(),
			get_info: new Function<[], CharacterLocalInfo | undefined>(),
			get: new Function<[request: string], boolean>(),
		},
	},

	// Loading data
	GetInterfaceInfo: new Function<[], [content: ScreenGui[]]>(),

	// Folders
	GetFolderInfo: new Function<[Name: string], Folder | undefined>(),

	// Character
	CharacterRespawn: new Function<[], string | void>(),
	CharacterReplicatedInfoChanged: new Remote<[CharacterReplicatedInfo]>(),
};
export = Network;
