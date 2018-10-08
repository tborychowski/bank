const cheerio = require('cheerio');
const Msg = require('node-msg');
const browser = require('./browser');
const config = require('../config.json').mbank;
const BANK_NAME = 'mBank';
const SELECTOR = {
	login: '#userID',
	pass: '#pass',
	btnNext: '#submitButton',
	overview: '.money-bar-header',
};


function parseDataTable (html) {
	const $ = cheerio.load(html);

	const name = $('.account-name').text().trim();
	let balance = $('#currentAccBalance').text().trim().replace(',', '.').replace(/\s/g, '');
	balance = 'zł ' + parseFloat(balance).toLocaleString('en-EN', { minimumFractionDigits: 2 });
	return [{name, balance}];
}


function writeTable (data) {
	Msg.log('\n');
	const table = data.map(row => ([row.name, row.balance]));
	table.unshift([Msg.magenta(BANK_NAME), 'Balance']);
	Msg.table(table);
}


async function login (open) {
	const loader = new Msg.loading();
	const page = await browser.page(open);
	await page.goto('https://online.mbank.pl/pl/Login');

	// PAGE 1
	await page.waitFor(SELECTOR.login);
	await page.type(SELECTOR.login, config.login);
	await page.type(SELECTOR.pass, config.pass);
	await page.click(SELECTOR.btnNext);

	let html;
	try {
		// Logged In
		await page.waitFor(SELECTOR.overview, { timeout: 5000 });
		html = await page.$eval(SELECTOR.overview, e => e.outerHTML);
		loader.stop();
	}
	catch (e) {
		loader.stop();
		Msg.error(`\n${BANK_NAME} failed to load. Try again later.`);
	}

	if (!open) {
		await page.browser().close();
		if (html) {
			const acc = parseDataTable(html);
			writeTable(acc);
		}
	}
}

module.exports = login;
