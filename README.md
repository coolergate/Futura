# Futura SDK

Semi-Engine made for [**Roblox-TS**](https://roblox-ts.com/)
> Currently unfinished!

### Client components

Client components must have the following functions:

- `Init(): void` - Called when the module is loaded, required to build the class
- `Start(): void` - Called in sync with other components at the same time
- `Update(): void` - Called every frame
- `FixedUpdate(): void` - Called every frame at a locked 60fps rate

> `Update()` and `FixedUpdate()` might be called at a slower rate depending on the device's performance.\
> Prefab file at `shared\misc\c_prefab.ts`

---

### Server components

Server components must have the following functions:

- `Init(): void` - Called when the module is loaded, required to build the class
- `Start(): void` - Called in sync with other components after everything is loaded

---

### Network

`shared/network.ts` houses all the networking remotes & functions.

#### Remotes:
`class Remote<headers extends unknown[]>`

Functions:
- `PostServer(headers): void`. (Client only)
- `PostClient(players: Player[], headers): void`. (Server only)
- `PostAllClients(ignore: Player[], headers): void`. (Server only)

Properties:
- `OnServerPost` - Called upon `Remote.PostServer()`
- `OnClientPost` - Called upon `Remote.PostClient()`

Example:

```ts
export const variable_name = new Remote<[name: string]>('ClientToServer');

// server
variable_name.OnServerPost = (user, name) => {};

// server (another script)
variable_name.OnServerPost = (user, name) => {}; // overwrites previous definition

// client
variable_name.PostServer('username');
```

#### Functions:

`Function<headers extends unknown[], response>`

Functions:
- `InvokeServer(...headers): response`. (Client only)
- `InvokeClient(player: Player, ...headers): response`. (Server only)

These invoke methods return the following functions:
- `await(): response` - Yields the script until the response is given
- `andthen(response => void)` - Calls the given function upon recieving the response (doesn't yield)

Properties:
- `OnServerInvoke: (user, ...headers) => response` - Server callback that must return a `response`
- `OnClientInvoke: (...headers) => response` - Client callback that must return a `response`

Example:

```ts
export const variable_name = new Function<[username: string], boolean>();

// server
variable_name.OnServerInvoke = (user, username) => {
	return true;
}

// client
variable_name.InvokeServer(args).await() // yields
variable_name.InvokeServer(args).andthen(response => {}) // doesn't yield
```

> More info at `shared\network.ts`

---

### Client console commands

Server commands can be created by using the `Server_ConCommand` class in `shared\vars.ts`.

Properties:
- `OnInvoke: (player: PlayerMonitor, ...args: string[]) => string | void)` ;

Example:
```ts
const respawn_req = new client_command<[]>('char_respawn');

respawn_req.callback = (player) => {};
```

---
