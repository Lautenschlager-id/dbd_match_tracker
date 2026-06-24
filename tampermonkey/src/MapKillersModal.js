class MapKillersModal extends BaseModal {
	constructor(mapData, cache) {
		const rowsHtml = mapData.killerList.map((killer, idx) => {
			const portraitHtml = UIComponents.Avatar(killer, 'killer', cache);
			return ModalViews.MapKillersRow(killer, idx, portraitHtml);
		}).join('');

		const tableHtml = ModalViews.Table(ModalViews.MapKillersColumns, rowsHtml);

		super({
			id: 'custom-map-killers-modal',
			title: `All Killers On ${mapData.name}`,
			subtitle: `${mapData.killerList.length} unique killers`,
			tableHtml
		});
	}
}