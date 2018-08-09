const cheerio = require('cheerio');
const Msg = require('node-msg');
const browser = require('./browser');
const config = require('../config.json').boi;

const SELECTOR = {
	login: '[id="form:userId"]',
	phone: '[id="form:phoneNumber"]',
	dob_d: '[id="form:dateOfBirth_date"]',
	dob_m: '[id="form:dateOfBirth_month"]',
	dob_y: '[id="form:dateOfBirth_year"]',
	btnNext: '[id="form:continue"]',
};

const getText = el => el.text().trim().replace(/eur\s?/, '').replace(/\s{2,}/g, ' ');

async function enterDigit (page, i, pin) {
	const sel = `[id="form:security_number_digit${i}"]`;
	const digit = await page.$(sel);
	if (digit) return await page.type(sel, pin[i - 1]);
	else return Promise.resolve();
}


function parseDataTable (html) {
	const $ = cheerio.load('<div>' + html + '</div>');
	return $('.acc_container').map((i, el) => {
		const name = getText($('.acc_name a', el));
		const balance = '€' + getText($('.acc_value', el));
		return {name, balance};
	}).get();
}


function writeTable (data) {
	Msg.log('\n');
	const table = data.map(row => ([row.name, row.balance]));
	table.unshift([Msg.blue('BoI'), 'Balance']);
	Msg.table(table);
}


async function login () {
	const loader = new Msg.loading();
	const page = await browser.page();
	await page.goto('https://www.365online.com/online365/');


	// PAGE 1
	await page.waitFor(SELECTOR.login);
	await page.type(SELECTOR.login, config.login);
	const phoneEl = await page.$(SELECTOR.phone);

	if (phoneEl) await page.type(SELECTOR.phone, config.phone);
	else {
		const [d,m,y] = config.dob.split('/');
		await page.type(SELECTOR.dob_d, d);
		await page.type(SELECTOR.dob_m, m);
		await page.type(SELECTOR.dob_y, y);
	}
	await page.click(SELECTOR.btnNext);


	// PAGE 2
	await page.waitFor('.security_numbers');
	await enterDigit(page, 1, config.pin);
	await enterDigit(page, 2, config.pin);
	await enterDigit(page, 3, config.pin);
	await enterDigit(page, 4, config.pin);
	await enterDigit(page, 5, config.pin);
	await enterDigit(page, 6, config.pin);

	const navigationPromise = page.waitForNavigation();
	await page.click(SELECTOR.btnNext);


	// Logged In
	await navigationPromise;
	// await page.waitFor(1000);
	await page.waitFor('.content_body', { timeout: 5000 });
	const html = await page.$eval('.content_body', e => e.innerHTML);
	await page.browser().close();
	loader.stop();

	const acc = parseDataTable(html);
	writeTable(acc);
}

module.exports = login;
