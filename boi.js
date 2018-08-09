const BASE_URL = 'https://www.365online.com/online365/';
const cheerio = require('cheerio');
const Msg = require('node-msg');

const config = require('./config.json');

function getMonth (str) {
	const m = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].indexOf(str);
	return ('0' + m).substr(-2);
}

function parseDataTable (html) {
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

function writeTable (title, balance, data) {
	balance = '€' + balance.replace(/eur/, '').trim();

	Msg.log('\n' + title);
	const table = data.map(row => ([row.originalDate, row.desc, row.debit || row.credit]));
	table.unshift(['Date', 'Desc', 'Amount']);
	table.push(['', '', '---------'], ['', '', Msg.cyan(balance)]);
	Msg.table(table);
}


async function login () {
	const loader = new Msg.loading();

	const puppeteer = require('puppeteer');
	const puppeteerCfg = {
		headless: true,
		ignoreHTTPSErrors: true,
		args: [
			'--disable-dev-profile',
			'--disable-setuid-sandbox',
			'--disable-web-security',
			'--disable-infobars',
			'--no-sandbox',
			'--disable-extensions',
			'--allow-running-insecure-content',
			'--ignore-certificate-errors',
		]
	};
	const browser = await puppeteer.launch(puppeteerCfg);
	const page = await browser.newPage();

	await page.goto(BASE_URL);


	// PAGE 1
	await page.waitFor('[id="form:userId"]');

	await page.type('[id="form:userId"]', config.login);

	const phoneEl = await page.$('[id="form:phoneNumber"]');
	if (phoneEl) {
		await page.type('[id="form:phoneNumber"]', config.phone);
	}
	else {
		const [d,m,y] = config.dob.split('/');
		await page.type('[id="form:dateOfBirth_date"]', d);
		await page.type('[id="form:dateOfBirth_month"]', m);
		await page.type('[id="form:dateOfBirth_year"]', y);
	}
	await page.click('[id="form:continue"]');


	// PAGE 2
	await page.waitFor('.security_numbers');

	const digit1 = await page.$('[id="form:security_number_digit1"]');
	const digit2 = await page.$('[id="form:security_number_digit2"]');
	const digit3 = await page.$('[id="form:security_number_digit3"]');
	const digit4 = await page.$('[id="form:security_number_digit4"]');
	const digit5 = await page.$('[id="form:security_number_digit5"]');
	const digit6 = await page.$('[id="form:security_number_digit6"]');

	if (digit1) await page.type('[id="form:security_number_digit1"]', config.pin[0]);
	if (digit2) await page.type('[id="form:security_number_digit2"]', config.pin[1]);
	if (digit3) await page.type('[id="form:security_number_digit3"]', config.pin[2]);
	if (digit4) await page.type('[id="form:security_number_digit4"]', config.pin[3]);
	if (digit5) await page.type('[id="form:security_number_digit5"]', config.pin[4]);
	if (digit6) await page.type('[id="form:security_number_digit6"]', config.pin[5]);

	await page.click('[id="form:continue"]');



	// Logged In
	await page.waitFor('.acc_container');



	// current account
	const acc1TitleSel = '[id="form:retailAccountSummarySubView0:retailAccountSummaryTogglePanel-0"] .rich-tglctrl';
	await page.click(acc1TitleSel);
	await page.waitFor('[id="form:retailAccountSummarySubView0:account_InProgress_0:tb"]');

	const title1 = await page.$eval(acc1TitleSel, e => e.innerText);
	const balance1 = await page.$eval('[id="form:retailAccountSummarySubView0:balance"]', e => e.innerText);
	const html1 = await page.$eval('[id="form:retailAccountSummarySubView0:account_InProgress_0:tb"]', e => e.innerHTML);


	// credit card account
	const acc2TitleSel = '[id="form:retailAccountSummarySubView1:accountSummaryTogglePanel-1"] .rich-tglctrl';
	await page.click(acc2TitleSel);
	await page.waitFor('[id="form:retailAccountSummarySubView1:account_1"]');

	const title2 = await page.$eval(acc2TitleSel, e => e.innerText);
	const balance2 = await page.$eval('[id="form:retailAccountSummarySubView1:outputPanel-1"] .acc_value', e => e.innerText);
	const html2 = await page.$eval('[id="form:retailAccountSummarySubView1:account_1"]', e => e.innerHTML);

	await browser.close();
	loader.stop();

	const data1 = await parseDataTable(html1);
	writeTable(title1, balance1, data1);

	const data2 = await parseDataTable(html2);
	writeTable(title2, balance2, data2);

}

module.exports = login;
