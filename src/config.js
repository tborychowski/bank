const fs = require('fs');
const path = require('path');
const keychain = require('keychain');
const Msg = require('node-msg');
const account = 'bank-script';
const service = 'bank-script';
const  CONFIG_FILE = path.resolve(process.cwd(), 'config.json');


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
	if (!fs.existsSync(CONFIG_FILE)) return Msg.error('Config file not found!');
	const config = require(CONFIG_FILE);
	return write(config).then(() => {
		Msg.success('Config securely stored in your Keychain');
		fs.unlinkSync(CONFIG_FILE);
	});
}

function restoreConfig () {
	return read().then(res => {
		fs.writeFileSync(CONFIG_FILE, JSON.stringify(res, null, 4));
		Msg.success('Config successfully restored');
	});
}

module.exports = {
	get: read,
	storeConfig,
	restoreConfig,
};
