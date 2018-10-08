const fs = require('fs');
const keychain = require('keychain');
const account = 'bank-script';
const service = 'bank-script';
/*eslint no-console: 0 */

function write (json) {
	const password = JSON.stringify(json);
	return new Promise((resolve, reject) => {
		keychain.setPassword({ account, service, password }, err => {
			if (err) return reject(err);
			resolve();
		});
	});
}

function read (key) {
	return new Promise((resolve, reject) => {
		keychain.getPassword({ account, service }, (err, res) => {
			if (err) return reject(err);
			const json = JSON.parse(res);
			return resolve(key ? json[key] || {} : json);
		});
	});
}

function storeConfig () {
	const config = require('../config.json');
	if (!config) return console.error('Config file not found!');
	return write(config);
}

function restoreConfig () {
	return read().then(res => {
		fs.writeFileSync('./config.json', JSON.stringify(res, null, 4));
	});
}

module.exports = {
	get: read,
	storeConfig,
	restoreConfig,
};
