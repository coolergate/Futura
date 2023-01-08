// Creator: coolergate#2031
// Purpose: Remotes for communication between server and client(s)

import * as Folders from 'shared/folders';

const RunService = game.GetService('RunService');
const Players = game.GetService('Players');

const network_folder = Folders.Network;
let next_index = 1;

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

// ANCHOR Remotes
class Remote<headers extends unknown[]> {
	private Instance: RemoteEvent;

	// * Server
	OnServerPost = undefined as ((user: Player, ...args: headers) => void) | undefined;
	PostClient(users: Player[], ...data: headers) {
		assert(RunService.IsServer(), 'server-side only.' + ' (' + tostring(this.Instance.Name) + ')');
		users.forEach(user => {
			this.Instance.FireClient(user, ...data);
		});
	}
	PostAllClients(block: Player[] | undefined, ...data: headers) {
		assert(RunService.IsServer(), 'server-side only.' + ' (' + tostring(this.Instance.Name) + ')');
		Players.GetPlayers().forEach(user => {
			if (block !== undefined && block.includes(user)) return;
			this.Instance.FireClient(user, ...data);
		});
	}

	// * Client
	OnClientPost = undefined as ((...args: headers) => void) | undefined;
	PostServer(...args: headers) {
		assert(RunService.IsClient(), 'client-side only.' + ' (' + tostring(this.Instance.Name) + ')');
		this.Instance.FireServer(...args);
	}

	constructor() {
		this.Instance = Manager(next_index, 'RemoteEvent') as RemoteEvent;
		next_index++;

		if (RunService.IsServer())
			this.Instance.OnServerEvent.Connect((player, ...data) => {
				if (this.OnServerPost !== undefined) this.OnServerPost(player, ...(data as headers));
			});
		else
			this.Instance.OnClientEvent.Connect((...data) => {
				if (this.OnClientPost !== undefined) this.OnClientPost(...(data as headers));
			});
	}
}

// ANCHOR Function
class Function<headers extends unknown[], response> {
	Instance: RemoteFunction;

	OnServerInvoke = undefined as ((user: Player, ...args: headers) => response) | undefined;
	OnClientInvoke = undefined as ((...args: headers) => response) | undefined;

	constructor() {
		this.Instance = Manager(next_index, 'RemoteFunction') as RemoteFunction;
		next_index++;

		if (RunService.IsServer())
			this.Instance.OnServerInvoke = (player, ...args) => {
				assert(this.OnServerInvoke, `OnServerPost has not been declared! ${this.Instance.Name}`);
				return this.OnServerInvoke(player, ...(args as headers));
			};
		else
			this.Instance.OnClientInvoke = (...args) => {
				assert(this.OnClientInvoke, `OnClientPost has not been declared! ${this.Instance.Name}`);
				return this.OnClientInvoke(...(args as headers));
			};
	}

	InvokeServer(...args: headers) {
		assert(RunService.IsClient(), 'InvokeServer cannot be called from the server!');
		let response: response;
		let recieved_response = false;
		coroutine.wrap(() => {
			response = this.Instance.InvokeServer(...args) as response;
			recieved_response = true;
		})();
		return {
			await: function () {
				while (recieved_response === false) task.wait();
				return response;
			},
			andthen: function (callback: (response: response) => unknown) {
				coroutine.wrap(() => {
					while (recieved_response === false) task.wait();
					callback(response);
				});
			},
		};
	}
	InvokeClient(player: Player, ...args: headers) {
		assert(RunService.IsServer(), 'InvokeClient cannot be called from the client!');
		let response: response;
		let recieved_response = false;
		coroutine.wrap(() => {
			response = this.Instance.InvokeClient(player, ...args) as response;
			recieved_response = true;
		})();
		return {
			await: function () {
				while (recieved_response === false) task.wait();
				return response;
			},
			then: function (callback: (response: response) => unknown) {
				coroutine.wrap(() => {
					while (recieved_response === false) task.wait();
					callback(response);
				});
			},
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
	Entities: {
		Character: {
			LocalInfoUpdate: new Remote<[Angle: Vector2, Position: Vector3]>(),
			LocalInfoChanged: new Remote<[Info?: CharacterLocalInfo]>(),

			ReplicatedInfoChanged: new Remote<[Info: CharacterReplicatedInfo]>(),
			GetCurrentReplicated: new Function<[], CharacterReplicatedInfo[]>(),
		},
	},

	Items: {
		Weapons: {
			Change: new Function<[Slot: WeaponSlot], BaseWeaponInfo | undefined>(),
			ReloadWeapon: new Function<[ItemId: string], boolean>(),
			FiredWeapon: new Remote<[Orientation: CFrame]>(),
			RegisterHits: new Function<[ItemId: string, Hits: BulletRaycastInfo[]], void>(),
		},

		GetCameraCFrme: new Function<[], CFrame>(),

		Replicated: {
			WeaponFired: new Remote<[CharacterId: string, Direction: Vector2]>(),
		},
	},

	// Loading data
	GetInterfaceInfo: new Function<[], [content: ScreenGui[]]>(),

	// Folders
	GetFolderInfo: new Function<[Name: string], Folder | undefined>(),

	// Character
	CharacterRespawn: new Function<[], string | void>(),
	CharacterReplicatedInfoChanged: new Remote<[CharacterReplicatedInfo]>(),

	// Network debugging
	ServerDebugMessage: new Remote<[message: string]>(),
};
export = Network;
