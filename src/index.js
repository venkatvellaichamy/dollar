import Robinhood from "./robinhood";
import StockAnalytics from "./stock-analytics";

var r = new Robinhood({ "password" : "", "username" : ""});

r.getAllOrders()
	.then(data => {
		let stockAnalytics = new StockAnalytics(data);

		console.log(stockAnalytics.getEachSecurityData());
	})
// print that as table and chart