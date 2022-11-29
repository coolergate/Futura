# Ralmak SDK
Semi-Engine for [**Roblox-TS**](https://roblox-ts.com/) made by [*GGC Studios*.](https://www.roblox.com/groups/8549176/Galera-Galeruda-Community) *( Named after Halmak layout )*
> Contains code used in Roblox Downstreets.
> Framework unfinished!

### Client controller
Required functions: ( Called from `client/main.client.ts` )
- `Init(): void` - Yields
- `Start(): void` - Coroutine called
- `Update(): void` - Called every frame
- `FixedUpdate(): void` - Called every frame at 60FPS
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
> More info at the file `shared/network.ts`

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
variable_name.InvokeServer(args).await() // .await() because it's a promise
```
---
