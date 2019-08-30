const cheerio = require('cheerio');
const Msg = require('node-msg');
const browser = require('./browser');
const Config = require('./config');
const BANK_NAME = 'BZWBK';
const SELECTOR = {
	login: '#input_nik',
	btnNext: '#id2',
	login2: '#ordinarypin',
	btnNext2: '#okBtn2',
	overview: '.md-accounts-details-parent',
};

const CURRENCY = { PLN: 'zł', EUR: ' €', USD: ' $', GBP: ' £' };

function formatCurrency (currency, amount) {
	if (!currency) return;
	amount = parseFloat(amount).toLocaleString('en-EN', { minimumFractionDigits: 2 });
	return `${CURRENCY[currency]} ${amount}`;
}


function parseDataTable (html) {
	const $ = cheerio.load(html);
	return $('.md-account-box').map((i, el) => {
		const name = $('.md-account-name-line', el).text().trim();
		let balance = $('.account-avista .md-account-amount-first-section:first-child .md-account-ammount-big', el)
			.text().replace(',', '.');

		let currency = balance.match(/[A-Z]{3}/);
		if (currency && currency.length) currency = currency[0];
		balance = balance.replace(/[A-Z\s]/g, '').trim();
		return {name, balance: formatCurrency(currency, balance)};
	})
		.get()
		.filter(i => i.balance);
}


function writeTable (data) {
	Msg.log('\n');
	const table = data.map(row => ([row.name, row.balance]));
	table.unshift([Msg.green(BANK_NAME), 'Balance']);
	Msg.table(table);
}


async function login (open) {
	const loader = new Msg.loading();
	const config = await Config.get('wbk');
	const page = await browser.page(open);
	await page.goto('https://www.centrum24.pl/centrum24-web/login');

	// PAGE 1
	await page.waitFor(SELECTOR.login);
	await page.type(SELECTOR.login, config.login);
	await page.click(SELECTOR.btnNext);

	// PAGE 2
	await page.waitFor(SELECTOR.login2);
	await page.type(SELECTOR.login2, config.pass);
	await page.click(SELECTOR.btnNext2);


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
