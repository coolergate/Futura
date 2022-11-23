class CloudDataManager<t> {
	readonly name: string;
	private readonly data_type: t;
	private readonly data_store: DataStore;

	constructor(name: string, data_type: t) {
		this.name = name;
		this.data_type = data_type;

		this.data_store = game.GetService('DataStoreService').GetDataStore(name);
	}

	SaveData(Key: string, data: t) {
		this.data_store.SetAsync(Key, data);
	}
}
