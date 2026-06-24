const ClipboardUtils = {
	buildKillerSummary: (stats) => {
		let output = '';
		for (const item of stats.allKillers) {
			const total = (item.escapes || 0) + (item.deaths || 0);
			const escapePct = total ? Math.round((item.escapes / total) * 100) : 0;
			const deathPct = total ? Math.round((item.deaths / total) * 100) : 0;

			const line = `**${item.count}x** \`${item.name}\` < 🏃 ${item.escapes} \`${escapePct}%\` | 💀 ${item.deaths} \`${deathPct}%\` >\n`;

			// Prevent exceeding Discord/Markdown character limits
			if ((output.length + line.length) > 1990) break;
			output += line;
		}
		return output.trim();
	},

	buildMatchesSummary: (stats, activeTimeframe) => {
		const survivorGames = stats.targetedGames
			.filter(match => match?.playerStat?.playerRole === 'VE_Camper')
			.sort((a, b) => (a.matchStat.matchStartTime || 0) - (b.matchStat.matchStartTime || 0));

		const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
		let output = (activeTimeframe === 'TODAY') ? `**${today}:**\n\n` : `**Last 24 hours (${today}):**\n\n`;

		const totalGames = survivorGames.length;
		let escapes = 0; let deaths = 0;

		survivorGames.forEach(match => {
			const status = match.playerStat?.playerStatus?.id;
			if (MatchUtils.isEscape(status)) escapes++;
			else if (MatchUtils.isDeath(status)) deaths++;
		});

		const escapePct = totalGames > 0 ? Math.round((escapes / totalGames) * 100) : 0;
		const deathPct = totalGames > 0 ? Math.round((deaths / totalGames) * 100) : 0;
		output += `→ 🏃 ${escapes} (${escapePct}%) | 💀 ${deaths} (${deathPct}%)\n\n`;

		for (let i = 0; i < survivorGames.length; i++) {
			const match = survivorGames[i];
			const killer = match.opponentStat?.find(opp => opp.playerRole === 'VE_Slasher');
			if (!killer) continue;

			const char = killer.characterName;
			const killerName = char.name || char.id;
			const status = match.playerStat?.playerStatus?.id;
			const result = ['VE_Escaped', 'VE_SurrenderDraw'].includes(status) ? '🏃 Escaped' : '💀 Died';

			const line = `#${i + 1} - ${killerName} - ${result}\n`;
			if ((output.length + line.length) > 1990) break;
			output += line;
		}

		return output.trim();
	}
};