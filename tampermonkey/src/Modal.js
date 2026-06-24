const ModalViews = {
	Layout: (title, tableHtml, subtitle) => `
		<div role="dialog" aria-label="${title}" aria-modal="true" class="modal-overlay">
			<div class="flex size-full items-center justify-center pointer-events-none *:pointer-events-auto">
				<div class="flex flex-col gap-4 p-6 lg:max-w-240 lg:min-w-240 h-[80vh] max-h-195 [@media(max-height:800px)]:max-h-[90%] rounded-sm bg-linear-to-b to-surface-dark from-theme-red-dark border border-primary-smoke-10/10 shadow-2xl">
	
					<section class="flex w-full flex-col gap-4 h-auto min-h-0 grow">
						<header class="flex items-center justify-between gap-4 border-b border-primary-smoke-10/10 pb-3">
							<div class="flex grow items-center justify-between gap-4">
								<h2 class="font-display text-display-xs text-neutral-text-light font-bold">
									${title}
								</h2>
								<span class="text-xs text-neutral-text-medium">
									${subtitle ?? ''}
								</span>
							</div>
						</header>
	
						${tableHtml}
					</section>
	
					<div class="w-full text-right">
						<button id="close-custom-modal" class="button-secondary button-large button-text w-full lg:w-auto group/button bg-radient-parent inline-flex items-center relative overflow-hidden cursor-pointer transition-all duration-300 shrink-0 hover:shadow-none text-button-lg h-11 px-4 bg-follow-parent font-display font-medium uppercase text-button-secondary hover:text-button-secondary-hover bg-button-surface-secondary hover:bg-button-surface-secondary-hover rounded-button-sm border-(length:--outline-button-secondary) border-button-border-secondary shadow-(--shadow-button-secondary) focus-visible:outline-dotted focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:transition-none focus-visible:shadow-(--shadow-focus) focus-visible:text-button-secondary disabled:opacity-30 disabled:cursor-not-allowed" type="button" title="Close modal">
							<span class="relative z-1 flex items-center size-full pointer-events-none justify-center">Close</span>
							<span class="bg-follow-secondary bg-follow" style="--x: 22.9375px; --y: -0.6806640625px;"></span>
						</button>
					</div>
				</div>
			</div>
			<div id="custom-modal-backdrop" class="modal-backdrop"></div>
		</div>
	`,

	Table: (columnsHtml, rowsHtml) => `
		<table class="flex flex-col w-full text-neutral-text-xlight grow overflow-auto rounded-sm border border-primary-smoke-10/10 bg-surface-black/10">
			<thead class="block overflow-auto shrink-0 bg-surface-black/40 border-b border-primary-smoke-10/10 sticky top-0 z-10" style="grid-template-columns: repeat(12, 1fr);">
				<tr class="w-full grid grid-cols-[inherit]">
					${columnsHtml}
				</tr>
			</thead>
			<tbody class="block h-auto w-full bg-transparent" style="grid-template-columns: repeat(12, 1fr);">
				${rowsHtml}
			</tbody>
		</table>
	`,

	MapKillersColumns: `
		<th class="font-medium flex items-center justify-start text-left text-display-xxs font-display px-4 py-3" colspan="2" style="grid-column: span 2 / span 2;">Killers</th>
		<th class="font-medium flex items-center justify-start text-left text-display-xxs font-display px-4 py-3" colspan="8" style="grid-column: span 8 / span 8;"></th>
		<th class="font-medium flex items-center justify-end text-right text-display-xxs font-display px-4 py-3" colspan="2" style="grid-column: span 2 / span 2;">Matches</th>
	`,

	MapKillersRow: (item, idx, portraitHtml) => `
		<tr class="w-full grid grid-cols-[inherit] items-center ${(idx % 2 === 0 ? 'custom-stripe-dark-even' : 'custom-stripe-dark-odd')}">
			<td class="font-medium flex items-center justify-start text-left text-md font-mono px-4 py-3" colspan="2" style="grid-column: span 2 / span 2;">
				${idx + 1}
			</td>
			<td class="font-medium flex items-center justify-start text-left text-md px-4 py-3" colspan="8" style="grid-column: span 8 / span 8;">
				<div class="flex items-center gap-3">
					${portraitHtml}
					<h3 class="text-display-xs font-sans truncate font-medium max-w-[150px]" title="${item.name}">
						${item.name}
					</h3>
				</div>
			</td>
			<td class="font-medium flex items-center justify-end text-right text-md font-mono px-4 py-3 text-orange-400" colspan="2" style="grid-column: span 2 / span 2;">
				${item.count}
			</td>
		</tr>
	`,
};

class BaseModal {
	constructor({ id, title, subtitle, tableHtml }) {
		this.id = id;
		this.title = title;
		this.subtitle = subtitle;
		this.tableHtml = tableHtml;
		this.element = null;

		this.close = this.close.bind(this);
	}

	show() {
		document.getElementById(this.id)?.remove();

		this.element = document.createElement('div');
		this.element.id = this.id;

		this.element.innerHTML = ModalViews.Layout(this.title, this.tableHtml, this.subtitle);
		document.body.appendChild(this.element);

		this.element.querySelector('#close-custom-modal').addEventListener('click', this.close);
		this.element.querySelector('#custom-modal-backdrop').addEventListener('click', this.close);
		document.addEventListener('keydown', this._handleEscKey);
	}

	close() {
		if (this.element) {
			this.element.remove();
			this.element = null;
		}
		document.removeEventListener('keydown', this._handleEscKey);
	}

	_handleEscKey = (e) => {
		if (e.key === 'Escape') this.close();
	};
}