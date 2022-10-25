const Values = {
	// character values
	CCurrentCharacter: undefined as BaseCharacter | undefined,
	CCharacterSpeed: new Vector3(), // AssemblyLinearVelocity
	CCharacterMovement: new Vector3(), // World MoveDirection
	Character: {
		Health: 0,
		MaxHealth: 150,
		Model: undefined as BaseCharacter | undefined,
		Zone: undefined as string | undefined,
	},

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
