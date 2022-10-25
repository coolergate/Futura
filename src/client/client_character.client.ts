task.wait(1);

import Network from 'shared/network';
import Signals from './providers/signals';
import Values from './providers/values';
import console_cmds from './providers/cmds';
import Log from '@rbxts/log';
import Folders from 'shared/folders';
import { Bin } from '@rbxts/bin';
import RenderPriorities from './components/render';

Signals.Start.Wait();

const ReplicatedStorage = game.GetService('ReplicatedStorage');
const PhysicsService = game.GetService('PhysicsService');
const StarterPlayer = game.GetService('StarterPlayer');
const StarterGui = game.GetService('StarterGui');
const RunService = game.GetService('RunService');
const Workspace = game.GetService('Workspace');

const Server_RespawnRequest = Network.Client.Get('RequestRespawn');
const Server_CharUpdated = Network.Client.Get('CharacterStatusUpdated');

Signals.CharacterRequestRespawn.OnInvoke = function () {
	const CharacterInfo = Server_RespawnRequest.CallServer();
	if (!CharacterInfo) return;

	const Character = CharacterInfo.Model;
	const Humanoid = CharacterInfo.Model.WaitForChild('Humanoid') as Humanoid;

	Values.Character.Health = CharacterInfo.Info.Health;
	Values.Character.MaxHealth = CharacterInfo.Info.MaxHealth;
	Values.Character.Model = Character;
	Values.CCurrentCharacter = Character;

	Character.GetChildren().forEach((instance) => {
		if (instance.IsA('BasePart')) {
			instance.LocalTransparencyModifier = 1;
		}
	});
};

Server_CharUpdated.Connect((CharacterInfo) => {
	// Check health
	if (CharacterInfo.Info.Health !== Values.Character.Health) {
		if (CharacterInfo.Info.Health === 0) {
			Signals.CharacterDied.Fire();

			CharacterInfo.Model.GetChildren().forEach((instance) => {
				if (instance.IsA('BasePart')) {
					instance.LocalTransparencyModifier = 1;
				}
			});

			return;
		}

		const StoredHealth = Values.Character.Health;
		const NewHealth = CharacterInfo.Info.Health;
		if (StoredHealth > NewHealth) Signals.CharacterTookDamage.Fire();
		else Signals.CharacterHealed.Fire();
		Values.Character.Health = NewHealth;
		Values.Character.MaxHealth = CharacterInfo.Info.MaxHealth;
	}
});

// Setup characters
Folders.GEntities.char_players.GetChildren().forEach((inst) => {
	const Humanoid = inst.WaitForChild('Humanoid') as Humanoid;
	const Animator = Humanoid.WaitForChild('Animator') as Animator;
	const HumanoidRootPart = inst.WaitForChild('HumanoidRootPart') as BasePart;

	inst.GetChildren().forEach((descendant) => {
		if (descendant.IsA('Accessory') || descendant.IsA('Hat')) {
			const Handle = descendant.FindFirstChildWhichIsA('BasePart');
			if (!Handle) return;
			Handle.LocalTransparencyModifier = 1;
			Handle.CanCollide = false;
			Handle.CanQuery = false;
			Handle.CanTouch = false;
			return;
		}

		if (descendant.IsA('BasePart')) {
			PhysicsService.SetPartCollisionGroup(descendant, 'GBaseCharacters');
		}
	});
});

// Check if character is within a region

const zoneCheckParams = new OverlapParams();
zoneCheckParams.FilterDescendantsInstances = [Folders.GEntities.char_players];
zoneCheckParams.FilterType = Enum.RaycastFilterType.Whitelist;

RunService.BindToRenderStep('char_regioncheck', RenderPriorities.CharacterRegions, () => {
	if (!Values.Character.Model || Values.Character.Health <= 0) {
		Values.Character.Zone = undefined;
		return;
	}

	const RootPart = Values.Character.Model.FindFirstChild('HumanoidRootPart');
	if (!RootPart) return;

	const func_entities = Folders.GMap.func_entities;

	func_entities.GetChildren().forEach((inst) => {
		if (!inst.IsA('BasePart') || Values.Character.Zone !== undefined) return;

		const parts = Workspace.GetPartsInPart(inst, zoneCheckParams);
		parts.forEach((instance) => {
			if (
				!instance.IsA('BasePart') ||
				inst.Name.match('func_zone_')[0] === undefined ||
				Values.Character.Zone !== undefined
			)
				return;

			const parent = instance.Parent!;
			if (parent === Values.Character.Model && instance.Name === 'HumanoidRootPart') {
				Values.Character.Zone = instance.Name.gsub('func_zone_', '')[0];
			}
		});
	});
});

const reset_bindableEvent = new Instance('BindableEvent');
reset_bindableEvent.Event.Connect(() => {
	Signals.SendConsoleCommand.Fire('//reset');
});
StarterGui.SetCore('ResetButtonCallback', reset_bindableEvent);
