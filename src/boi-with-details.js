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
	accounts: [
		{
			title: '[id="form:retailAccountSummarySubView0:retailAccountSummaryTogglePanel-0"] .rich-tglctrl',
			table: '[id="form:retailAccountSummarySubView0:account_InProgress_0:tb"]',
			balance: '[id="form:retailAccountSummarySubView0:balance"]',
		},
		{
			title: '[id="form:retailAccountSummarySubView1:accountSummaryTogglePanel-1"] .rich-tglctrl',
			table: '[id="form:retailAccountSummarySubView1:account_1"]',
			balance: '[id="form:retailAccountSummarySubView1:outputPanel-1"] .acc_value',
		}
	]
};

let page;



function getMonth (str) {
	const m = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].indexOf(str);
	return ('0' + m).substr(-2);
}


async function enterDigit (i) {
	const sel = `[id="form:security_number_digit${i}"]`;
	const digit = await page.$(sel);
	if (digit) return await page.type(sel, config.pin[i - 1]);
	else return Promise.resolve();
}


function parseDataTable2 (html) {
	const $ = cheerio.load(`<table>${html}</table>`);
	return $('.rich-table-row')
		.map((i, row) => {
			const [date, desc, debit, credit, balance] = $('.rich-table-cell', row)
				.map((j, cell) => $(cell).text().trim())
				.get();
			return {date, desc, debit, credit, balance};
		})
		.get()
		.map(row => {
			if (/^\d{2}\w{3}/.test(row.desc)) {
				row.originalDate = row.desc.substr(0, 5);
				const d = row.originalDate.substr(0, 2);
				const m = getMonth(row.originalDate.substr(2));
				const y = row.date.split('/').pop();
				row.originalDate = `${d}/${m}/${y}`;
				row.desc = row.desc.substr(5);
			}
			else row.originalDate = row.date;
			if (row.credit) row.credit = '+ €' + row.credit;
			if (row.debit) row.debit = '€' + row.debit;
			return row;
		});
}


function parseDataTable (html) {
	const $ = cheerio.load('<div>' + html + '</div>');
	return $('.acc_container').map((i, el) => {
		const name = $('.acc_name a', el).text().trim().replace(/\s{2,}/g, ' ');
		const balance = '€' + $('.acc_value', el).text().trim().replace(/eur\s?/, '').replace(/\s{2,}/g, ' ');
		return {name, balance};
	}).get();
}


function writeTable (data) {
	Msg.log('\n');
	const table = data.map(row => ([row.name, row.balance]));
	table.unshift([Msg.blue('BoI'), 'Balance']);
	Msg.table(table);
}

// function writeTable (data) {
// 	Msg.print('\nBoI', 'blue');

// 	// balance = '€' + balance.replace(/eur/, '').trim();

// 	// Msg.log('\n' + title);
// 	const table = data.map(row => ([row.originalDate, row.desc, row.debit || row.credit]));
// 	table.unshift(['Date', 'Desc', 'Amount']);
// 	table.push(['', '', '---------'], ['', '', Msg.cyan(balance)]);
// 	Msg.table(table);
// }





async function login () {
	const loader = new Msg.loading();

	page = await browser.page();
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
	await enterDigit(1);
	await enterDigit(2);
	await enterDigit(3);
	await enterDigit(4);
	await enterDigit(5);
	await enterDigit(6);

	const navigationPromise = page.waitForNavigation();
	await page.click(SELECTOR.btnNext);


	// Logged In
	await navigationPromise;
	// await page.waitFor(1000);
	await page.waitFor('.content_body', { timeout: 5000 });


	// expand histories
	// await page.click(SELECTOR.accounts[0].title);
	// await page.waitFor(SELECTOR.accounts[0].table);
	// await page.click(SELECTOR.accounts[1].title);
	// await page.waitFor(SELECTOR.accounts[1].table);


	const html = await page.$eval('.content_body', e => e.innerHTML);

	await page.browser().close();
	loader.stop();

	const acc = parseDataTable(html);
	writeTable(acc);


	// const accounts = SELECTOR.accounts.map(async acc => {
	// 	const name = await page.$eval(acc.title, e => e.innerText);
	// 	let balance = await page.$eval(acc.balance, e => e.innerText);
	// 	balance = '€' + balance.replace(/eur/, '').trim();

	// 	const html = await page.$eval(acc.table, e => e.innerHTML);
	// 	const data = await parseDataTable(html);
	// 	return {name, balance, data};
	// });

	// await Promise.all(accounts);

	// await page.browser().close();
	// loader.stop();

	// writeTable(accounts);
}

module.exports = login;
