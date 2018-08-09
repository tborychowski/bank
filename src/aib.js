const cheerio = require('cheerio');
const Msg = require('node-msg');
const browser = require('./browser');
const config = require('../config.json').aib;

const SELECTOR = {
	login: '#regNumber_id',
	btnNext: '#nextButton',
	accTable: '.accounts-list',
	loginForm2: '#loginstep2Form',
	accountOverview: '.accountoverview',
};


async function enterDigit (page, i, pin) {
	const digitLabel = await page.$eval(`[for="digit${i}Text"]`, e => e.innerText);
	const digitNumber = parseInt(digitLabel.replace('Digit', '').trim(), 10);
	return await page.type(`#digit${i}Text`, pin[digitNumber - 1]);
}


function parseDataTable (html) {
	const $ = cheerio.load(html);
	return $('.accounts-list-item').map((i, el) => {
		const name = $('.account-name', el).text().trim();
		const balance = '€' + $('.account-balance .a-amount', el).text().trim().replace(/\s?DR/, '');
		return {name, balance};
	}).get();
}


function writeTable (data) {
	Msg.log('\n');
	const table = data.map(row => ([row.name, row.balance]));
	table.unshift([Msg.magenta('AIB'), 'Balance']);
	Msg.table(table);
}


async function login () {
	const loader = new Msg.loading();
	const page = await browser.page();
	await page.goto('https://onlinebanking.aib.ie/inet/roi/login.htm');

	// PAGE 1
	await page.waitFor(SELECTOR.login);
	await page.type(SELECTOR.login, config.login);
	await page.click(SELECTOR.btnNext);

	// PAGE 2
	await page.waitFor(SELECTOR.loginForm2);
	await enterDigit(page, 1, config.pin);
	await enterDigit(page, 2, config.pin);
	await enterDigit(page, 3, config.pin);
	await page.click(SELECTOR.btnNext);

	// Logged In
	await page.waitFor(SELECTOR.accountOverview);
	const html = await page.$eval(SELECTOR.accTable, e => e.outerHTML);
	await page.browser().close();
	loader.stop();

	const acc = parseDataTable(html);
	writeTable(acc);
}

module.exports = login;
