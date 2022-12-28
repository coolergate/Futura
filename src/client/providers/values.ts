// Author: coolergate#2031
// Reason: Store values that can be shared between scripts

const Values = {
	Character: undefined as CharacterLocalInfo | undefined,

	// camera values
	Camera_CFrame: new CFrame(),
	Camera_Delta: new Vector2(),
	Camera_Enable: true,
	Camera_Unlock: new Map<string, boolean>(),
};

export = Values;
