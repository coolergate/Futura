# Futura SDK

Semi-Engine made for [**Roblox-TS**](https://roblox-ts.com/)
> Currently unfinished!

### Client components

Client components must have the following functions:

- `Init(): void`
- `InitOrder: const number`
- Component class
- `Start(): void`
- `Update(): void`

`Init()` is called accordingly to InitOrder, required to build the class

`Start()` is called in sync with other components, starting them all at the same time

`Update()` is called in a fixed 60FPS rate, devices with lower framerates will increase the time between calls

> More info at `client/component/prefab.ts`

---

### Network

`shared/network.ts` houses all the networking components.
Components can be created with the classes:

- `Remote<headers extends unknown[]>`
- `Function<headers extends unknown[], response>`

Remotes are handled like HTTP calls.

- (type) `NetworkMode` 'ClientToServer' or 'ServerToClient'
- (property) `OnServerPost` Handles all data sent from client -> server
- (property) `OnClientPost` Handles all data sent from server -> client

These are made on purpose so that you don't connect multiple callbacks to the same remote.

Example:

```ts
export const variable_name = new Remote<[]>('ClientToServer');

// server
variable_name.OnServerPost = (user, data) => {};

// server (another script)
variable_name.OnServerPost = (user, data) => {}; // overwrites previous definition

// client
variable_name.PostServer(data);
```

> More info at `shared/network.ts`

Functions are bi-directional and returns a Promise when Invoked.

- (property) `OnServerInvoke` Handles all data sent from client -> server
- (property) `OnClientInvoke` Handles all data sent from client -> server

Also made on purpose so that you don't connect multiple callbacks to the same Function.

Example:

```ts
export const variable_name = new Function<[username: string], boolean>();

// server
variable_name.OnServerInvoke = (user, data) => {}

// client
variable_name.InvokeServer(args).await() // .await() for it being a promise
```

---

### Client commands

You can create server-side commands by using the `client_command` class in `server/providers/client_cmds.ts`.

Example: `const respawn_req = new client_command<[]>('char_respawn');`
> Taken from `server/components/entities.ts`

Then when called on the client's console it would return "command callback has not been defined!".
You can define a callback by setting the `callback` property

```ts
const respawn_req = new client_command<[]>('char_respawn');

respawn_req.callback = (player) => {};
```

---
