import fs from 'fs';
import csvparse from 'csv-parse';

export default class CsvReader {
	constructor(fileName) {
		this.fileName = fileName;
	}

	getFileName() {
		return this.fileName;
	}

	readCSVFile() {
		return new Promise((resolve, reject) => {
			fs.readFile(this.fileName, 'utf8', (err, data) => {
				if(err) reject(err);
				else resolve(data);
			})
		})
	}

	processCSV(csvData) {
		return new Promise((resolve, reject) => {
			csvparse(csvData, {columns: true}, (err, data) => {
				if(err) reject(err);
				else resolve(data);
			})
		})
	}

	fixDataTypes(list) {
		return new Promise((resolve, reject) => {
			resolve(
				list.map(item => {
					return {
						...item,
						average_price: parseFloat(item.average_price),
						created_at: new Date(item.created_at),
						timestamp: new Date(item.timestamp),
						quantity: parseInt(item.quantity),
						fees: parseFloat(item.fees),
						cumulative_quantity: parseInt(item.cumulative_quantity)
					}
				})
			);
		});
	}

	csvToRecords() {
		return this.readCSVFile()
				   .then(this.processCSV.bind(this))
				   .then(this.fixDataTypes.bind(this));
	}
}