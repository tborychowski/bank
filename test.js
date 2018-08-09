/*eslint no-console: 0 */
const cheerio = require('cheerio');
const fs = require('fs');
const html = fs.readFileSync('./test.html', 'utf8');


function getMonth (str) {
	const m = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].indexOf(str);
	return ('0' + m).substr(-2);
}


const $ = cheerio.load(`<table>${html}</table>`);

let data = $('.rich-table-row').map((i, row) => {
	const [date, desc, debit, credit, balance] = $('.rich-table-cell', row).map((j, cell) => $(cell).text().trim()).get();
	return {date, desc, debit, credit, balance};
}).get();

data = data.map(row => {
	row.originalDate = row.desc.substr(0, 5);
	const d = row.originalDate.substr(0, 2);
	const m = getMonth(row.originalDate.substr(2));
	const y = row.date.split('/').pop();
	row.originalDate = `${d}/${m}/${y}`;
	row.desc = row.desc.substr(5);
	return row;
});

console.log(data);
