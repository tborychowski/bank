const puppeteer = require('puppeteer');

const width = 1200;
const height = 1080;

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
		`--window-size=${width},${height}`,
		'--ignore-certificate-errors',
	]
};



async function page (open) {
	if (open) puppeteerCfg.headless = false;
	const browser = await puppeteer.launch(puppeteerCfg);
	const pg = await browser.newPage();
	await pg.setViewport({width, height});
	return pg;
}


module.exports = {
	page,
};
