const http = require('http');
const BASE_URL = 'https://sap.ci-dub.build-dev.only.sap';


async function login (username, password) {
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
	// page.setDefaultNavigationTimeout(0);

	console.log('Opening build...');
	await page.goto(`${BASE_URL}/projects`);

	console.log('Waiting for email input...');
	await page.waitForSelector('#input-email');
	await page.type('#input-email', username);
	const inputElement = await page.$('button[type=submit]');
	await inputElement.click({ waitUntil: 'networkidle0' });

	console.log('Loading form...');
	await page.waitForSelector('#j_username');
	await page.evaluate('document.getElementById(\'j_username\').value = \'' + username + '\'');
	await page.evaluate('document.getElementById(\'j_password\').value = \'' + password + '\'');
	await page.evaluate('document.getElementById(\'logOnFormSubmit\').click()');

	console.log('Loading build page...');
	try { await page.waitForSelector('#projects-widget-home', { timeout: 10000 }); }
	catch (e) { console.log(e); return null; }

	const cookies = await page.cookies();

	console.log('Parsing cookies...');
	const buildSessionId = cookies.find(c => c.name === 'buildSessionId').value;
	const token = cookies.find(c => c.name === 'X-CSRF-Token').value;

	await browser.close();
	console.log('All done!');
	return `buildSessionId=${buildSessionId}; X-CSRF-Token=${token}`;
}



function error404 (req, res) {
	res.writeHead(404, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
	res.write('{"message": "Page not found"}');
	res.end();
}

function error401 (req, res) {
	res.writeHead(401, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
	res.write('{"message": "Invalid credentials"}');
	res.end();
}


async function handleAuth (req, res) {
	console.log('Responding...');
	const {username, password} = req.body;
	if (!username || !password) return error401(req, res);

	const cookie = await login(username, password);
	if (!cookie) return error401(req, res);

	res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
	res.write(`{"cookie": "${cookie}" }`);
	res.end();
}


async function handleProjects (req, res) {
	const fetch = require('node-fetch');

	console.log('Responding...');
	const {username, password} = req.body;
	if (!username || !password) return error401(req, res);

	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

	const Cookie = await login(username, password);
	if (!Cookie) return error401(req, res);

	console.log('Getting projects\' list...');
	const url = `${BASE_URL}/projects/api/private/v1/projects?showArchived=false&showInvited=false&startIndex=0`;
	const opts = { method: 'GET', headers: { 'Content-Type': 'application/json', Cookie }};
	return fetch(url, opts)
		.then(data => data.json())
		.then(data => {
			console.log('Done!');
			res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
			res.write(JSON.stringify(data.projects));
			res.end();
		})
		.catch(e => console.error(e));
}



function handler (req, res) {
	if (req.url === '/auth') return handleAuth(req, res);
	if (req.url === '/projects') return handleProjects(req, res);
	error404(req, res);
}


http
	.createServer((req, res) => {
		req.on('data', chunk => req.body = (req.body || '') + chunk);
		req.on('end', () => {
			let json;
			try { json = JSON.parse(req.body); }
			catch (e) { json = null; }
			if (json) req.body = json;
			handler(req, res);
		});
	})
	.listen(3000, () => { console.log('http://localhost:3000'); });
