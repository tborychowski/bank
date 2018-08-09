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



async function page () {
	const browser = await puppeteer.launch(puppeteerCfg);
	return await browser.newPage();
}


module.exports = {
	page,
};
