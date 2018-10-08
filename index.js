#!/usr/bin/env node
const Args = require('arg-parser');
const Msg = require('node-msg');

const banks = {
	aib: require('./src/aib'),
	boi: require('./src/boi'),
	wbk: require('./src/wbk'),
	mbank: require('./src/mbank'),
};


function run ({code, open}) {
	if (!open && !code) return args.help();
	if (open && !code) return Msg.error('\nWhich code should I open (boi or aib)?');

	if (code === 'aib') return banks.aib(open);
	if (code === 'boi') return banks.boi(open);
	if (code === 'wbk') return banks.wbk(open);
	if (code === 'mbank') return banks.mbank(open);

	if (code ==='all') {
		if (open) return Msg.error('\nI can only open one bank at a time.');
		banks.aib();
		banks.boi();
		banks.wbk();
		banks.mbank();
		return;
	}
	Msg.error('Unknown command.');
}


const args = new Args('Bank manager', '1.0', 'Show stats and auto-login');
args.add({ name: 'open', desc: 'open browser and auto log-in', switches: [ '-o', '--open'] });
args.add({ name: 'code', desc: 'Bank code (boi or aib or all)' });

if (args.parse()) run(args.params);
