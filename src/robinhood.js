import RobinhoodAPI from 'robinhood';
import * as _ from 'lodash';
import fs from 'fs';

const SYMBOLS_HASH_FILE = './symbolsHash';

export default class Robinhood {
	constructor(credentials) {
		this.credentials = credentials;

		try {
			let symbolsHashFromFile = fs.readFileSync(SYMBOLS_HASH_FILE).toString();
			this.symbolsHash = JSON.parse(symbolsHashFromFile);
		} catch(ex) {
			this.symbolsHash = {};
		}

		Promise.prototype.thenReturn = function(value, callback) {
		    return this.then(function(data) {
		    	callback(data);
		        return value;
		    });
		};
	}

	getAllRawOrders() {
		let transactions = [];
		
		return new Promise((resolve, reject) => {
			let ordersCallback = (err, response, body) => {
			        if(err) {
			            reject(err);
			        }else{
			            transactions = transactions.concat(body.results);
			            if(body.next) {
			            	robinhoodAPI.url(body.next, ordersCallback);
			            } else {
			            	resolve(transactions);
			            }
			        }
			    };

			let robinhoodAPI = RobinhoodAPI(this.credentials, () => {
			    robinhoodAPI.orders(ordersCallback);
			});
		});
	}

	instrumentToSymbol(rawOder) {
		let instrumentUrl = rawOder.instrument,
			instrumentHashKey;

		instrumentHashKey = instrumentUrl.substring(0, instrumentUrl.length - 1);
		instrumentHashKey = instrumentHashKey.substring((instrumentHashKey.lastIndexOf("/") + 1));
		
		return new Promise((resolve, reject) => {
			if(this.symbolsHash[instrumentHashKey] != undefined) {
				rawOder.symbol = this.symbolsHash[instrumentHashKey];
				resolve(rawOder);
			} else {
				this._writeSymbolsHash = true;
				let robinhoodAPI = RobinhoodAPI(this.credentials, () => {
				    robinhoodAPI.url(instrumentUrl, (err, response, body) => {
				        if(err) {
				            reject(err);
				        } else {
				        	rawOder.symbol = this.symbolsHash[instrumentHashKey] = body.symbol;
				        	resolve(rawOder)
				        }
				    });
				});
			}
		});
	}

	fillSymbolWithInstrument(rawOrders) {
		let filledOrders = [],
			fillOrder = (filledOrder) => {
				let order = {
						...filledOrder,
						updated_at: new Date(filledOrder.updated_at),
						fees: parseFloat(filledOrder.fees),
						cumulative_quantity: parseInt(filledOrder.cumulative_quantity),
						executions_quantity: _.sum(filledOrder.executions.map(execution => parseInt(execution.quantity))),
						executions_price: (_.sum(filledOrder.executions.map(execution => parseFloat(execution.price))) / filledOrder.executions.length)
					};
				filledOrders.push(order);
			};

		let len = rawOrders.length;

		return new Promise((resolve, reject) => {
			let self = this;

			Promise.resolve(0).then(function loop(i) {
			    if (i < len && rawOrders[i]) {
			        return self.instrumentToSymbol.call(self, rawOrders[i])
			        						 .thenReturn(i + 1, fillOrder)
			        						 .then(loop);
			    }
			}).then(() => {
				if(self._writeSymbolsHash) {
					fs.writeFileSync(SYMBOLS_HASH_FILE, JSON.stringify(this.symbolsHash));
				}

			    resolve(filledOrders);
			}).catch(reject);
		});
	}

	getAllOrders() {
		return this.getAllRawOrders()
				.then(this.fillSymbolWithInstrument.bind(this));
	}
}