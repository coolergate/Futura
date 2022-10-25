import Network from 'shared/network';
import Signals from './providers/signals';
import Values from './providers/values';
import Input from './components/input';

Signals.Start.Wait();

const Weapons = {};
let current_weapon: WeaponInfo | undefined;
const weapon_canfire = true;

const RunService = game.GetService('RunService');

const Server_ChangeWeapon = Network.Client.Get('ChangeWeapon');
const Server_UpdateWeapon = Network.Client.Get('UpdateWeaponStats');

const attack_bind = new Input('attack');
const equip_primary = new Input('slot1');
const equip_secondary = new Input('slot2');
const equip_melee = new Input('slot3');

RunService.RenderStepped.Connect((dt) => {
	if (!weapon_canfire) return;
});
