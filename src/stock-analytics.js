export default class StockAnalytics {
	constructor(transactionData) {
		this.transactionData = transactionData;
	}

	getTotalProfit() {

	}

	getEachSecurityData() {
		let securitiesHash = {};

		if(this.transactionData && this.transactionData.length > 0) {
			let actualTransactions = 
					this.transactionData
						.filter(transaction => transaction.state != 'cancelled')
						.sort((a, b) => { 
							return new Date(a.updated_at) - new Date(b.updated_at); 
						});

			actualTransactions.forEach((transaction, i) => {
				let quantity = 0, 
					moneyMade = 0;

				if(!securitiesHash[transaction.symbol]) {
					securitiesHash[transaction.symbol] = { quantity, moneyMade }
				}

				if(transaction.side == 'buy') {
					quantity = securitiesHash[transaction.symbol].quantity + transaction.executions_quantity;
					moneyMade = securitiesHash[transaction.symbol].moneyMade - (transaction.executions_quantity * transaction.executions_price);
				} else {
					quantity = securitiesHash[transaction.symbol].quantity - transaction.executions_quantity;
					moneyMade = securitiesHash[transaction.symbol].moneyMade + (transaction.executions_quantity * transaction.executions_price);
				}

				console.log(i+1, transaction.updated_at, transaction.symbol, transaction.executions_quantity, transaction.side, transaction.executions_price, moneyMade);
				securitiesHash[transaction.symbol] = { quantity, moneyMade };
			});
		}

		return securitiesHash;
	}
}