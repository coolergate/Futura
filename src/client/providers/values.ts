//========= Copyright GGC Studios, All rights reserved. ============//
// Purpose: Store script values to be used with other scripts		//
//==================================================================//

const Values = {
	// character values
	Character: {
		Health: 0,
		MaxHealth: 150,
		CollisionBox: undefined as PlayerCollisionBox | undefined,
		Id: '',
	},

	// Movement values
	MovementInputRequest: false,

	// camera values
	CCameraCFrame: new CFrame(),
	CCameraDelta: new Vector2(),
	CCameraEnable: true,
	CCameraUnlock: new Map<string, boolean>(),
	CCameraLockTo: undefined as BasePart | undefined,

	// controller values
	LeftThumbstickValue: new Vector2(),
	RightThumbstickValue: new Vector2(),
};

export = Values;
