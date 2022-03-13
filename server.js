/*
TODO:
1. Add some kind of ranking system for stocks
2. Sessions, or something so that non-validated users cannot makes change to accounts
3. Add current user info to the top right corner (regardless of the current page, maybe use js within the .html files?)
4. Seperate the accounts page into multiple pages or use pug
*/

//Create express app
const express = require('express');
let app = express();

const session = require('express-session');
let request = require('request');
const path = require('path');
const fs = require('fs');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var sql = require('sqlite3');

var db = new sql.Database('StockInfo.db');
let mondb;

const mc = require("mongodb").MongoClient;

mc.connect("mongodb://localhost:27017/", function(err, client) {
	mondb = client.db('StockMarketSite');
});

//require module, pass it the session module
const MongoDBStore = require('connect-mongodb-session')(session);

//Creating the session store
const store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/StockMarketSite',
  collection: 'sessions'
});

// Use the session middleware 300000 milliseconds == 5 minutes
app.use(session({ secret: 'Test',
									store: store,
								  cookie:{maxAge:300000}}));

app.set("view engine", "pug");

//Setting up the routes
app.use(express.static("public/html"));
app.use(express.static("public/js"));
app.use(express.static("public/css"));
app.use(express.json());

app.get("/Accounts/List", getAccountList);
app.get('/Home', sendHome);
app.get("/Accounts/Session", getSessionStatus);
app.get("/Stocklist/Quote/:ticker", getQuote);
app.get("/Accounts/Recommendations", recommendationRequest);
app.get("/Accounts/:AcctNum", getAccount);
app.get("/Stocklist/Quote", getAllStocks);
app.get("/Accounts/Logout", logout);
app.get("/Accounts", sendAccounts);
app.get('/', sendHome);

app.post('/Accounts/Login', login);
app.post('/Accounts/Logout', logout, sendHome);
app.post('/Accounts/CreateProfile', createProfile);
app.post('/Stocklist/AddStock/:ticker', addStock);
app.post('/Stocklist/RemoveStock/:ticker', removeStock);
app.post('/Stocklist/UpdateStock/:ticker', updateStock);
app.post('/Accounts/OpenAccount', openAccount);
app.post('/Accounts/Buy', buyStock);
app.post('/Accounts/Sell', sellStock);
app.post('/Accounts/AdjustBalance', updateBalance);

function sendHome(req, res, next) {
	res.sendFile(path.join(__dirname + '/public/html' + '/Home.html'));
	return;
}

function sendAccounts(req, res, next) {
	res.sendFile(path.join(__dirname + '/public/html' + '/Accounts.html'));
	return;
}

//Responds to the client with a quote for the stock based on the ticker parameter
function getQuote(req, res, next) {

	//Getting the id parameter value
	let tickerID = req.params.ticker;

	let response;


  request("https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + tickerID +"&interval=5min&apikey=LQLHQ491NM8JFP72", function(err, resp, body){
    //storing the response
    response = JSON.parse(body);
		//Add code to query db if "note" recieved
		if (response["Note"]){
			db.get("SELECT * FROM stocks WHERE Ticker LIKE '" + tickerID + "'", function(err, row){
				if (row){
					res.send(JSON.stringify(row));
				}else{
					res.status(409).json(
						{"text":"Calls to API have been exceeded."}
					);
				}
			});
    //Verifying that the request worked
		}else if (response != null){
			db.get("SELECT * FROM stocks WHERE Ticker LIKE '" + tickerID + "'", function(err, row){
				if (row){
					request("https://www.alphavantage.co/query?function=OVERVIEW&symbol=" + tickerID +"&apikey=LQLHQ491NM8JFP72", function(err, resp2, overviewBody){
						let ovBody = JSON.parse(overviewBody);
					});
				}
			});

			res.send(JSON.stringify(response));
    }else{
      console.log("there was an error with the request");
			send404(res);
    }
  });

	return;
}

function login(req, res, next){
		//Change this to bring a user to their home page
		if (req.session.loggedin){
			db.all("SELECT AcctNum, Type, Balance FROM accounts NATURAL JOIN CustomerAccounts WHERE SSN like '" + req.session.SSN + "'", function(err, rows){
				if (rows == ""){
					res.status(200).json({"text":"Logged in as: " + req.session.name});
					return;
				}else{
					res.status(200).json({"text":"Logged in as: " + req.session.name, "accounts":rows, "sin":req.session.SSN});
					return;
				}
			});
		}else{
	    db.serialize(function() {
	      db.get("SELECT * FROM customers WHERE Name like '" + req.query.name + "'", function(err, row) {
						if (row == null){
							res.status(401).json({"text":"Not authorized. User does not exist."});
	          }else if (row.PWord == req.query.pass){
							req.session.loggedin = true;
							req.session.name = req.query.name;
							req.session.SSN = row.SSN;

							db.all("SELECT AcctNum, Type, Balance FROM accounts NATURAL JOIN CustomerAccounts WHERE SSN like '" + row.SSN + "'", function(err, rows){
								if (rows == ""){
									res.status(200).json({"text":"Logged in as: " + req.query.name, "sin":row.SSN});
								}else{
									res.status(200).json({"text":"Logged in as: " + req.query.name, "accounts":rows, "sin":row.SSN});
								}
							});
	          }else {
							res.status(401).json({"text":"Not authorized. Invalid password."});
						}
	      });
	    });
	}
}

function logout(req, res, next){
	req.session.loggedin = false;
	req.session.name = null;
	req.session.SSN = null;
	next();
}

function validateAccountOwner(req, acctNum){
	if (req.session.loggedin){
		db.get("SELECT * FROM CustomerAccounts WHERE AcctNum like '" + acctNum + "'", function(err, row) {
			if (row["SSN"] == req.session.SSN){
				console.log("validated")
				return 200;
			}else{
				console.log("unathorized")
				return 403;
			}
		});
	}else{
		return 401;
	}
}

//Responds to the users request with a list of all their accounts
function getAccountList(req, res, next){
	if (req.session.loggedin == false){
		res.status(401).send("Please log in to view your accounts.")
	}else{
		db.all("SELECT * FROM CustomerAccounts natural join accounts WHERE SSN like " + req.session.SSN, function(err, rows) {
			res.render("AccountList.pug", {accounts: rows, optionList:["TFSA", "RRSP", "RRIF", "LIRA", "RESP", "Cash"]})
		});
	}
}

//Determines whether the user is currently logged in or not
function getSessionStatus(req, res, next){
	let resObj;

	if (req.session.loggedin){
		resObj = {"Status" : true, "Name" : req.session.name, "SSN" : req.session.SSN};
	}else{
		resObj = {"Status" : false};
	}

	res.status(200).json(resObj);
}

//Adds a new customer to the Database
function createProfile(req, res, next){
	try{
		db.run("INSERT INTO customers VALUES("+req.body["sin"]+", '"+req.body["un"]+"', '"+req.body["address"]+"', '"+req.body["DOB"]+"', '"+req.body["pw"]+"')", function(){
			mongodb.collection("users").insertOne({Name:req.body["un"], PWord:req.body["pw"]}, function(err, result){
				console.log("User added to mongo.");
			});

			res.status(201).json({"text": "Profile created, welcome "+ req.body["un"] +"!"});
		});
	}catch{
		console.log("There was an error with your information");
	}
}

function getAccount(req, res, next){
	result = validateAccountOwner(req, req.params.AcctNum);

	if (result == 403){
		res.status(403).send("Error: This account does not belong to you.")
	}else if (result == 401){
		res.status(401).send("Error: Please login before accessing this account.")
	}else if (result == 200){
		db.all("SELECT * FROM StocksInAccounts WHERE AcctNum like '" + req.params.AcctNum + "'", function(err, rows) {
			res.status(200).json(rows);
		});
	}else{
		res.status(500).send("The server experienced an error. Please try again.")
	}
}

function getAllStocks(req, res, next){
	db.all("SELECT * FROM stocks", function(err, rows) {
		res.status(200).json(rows);
	});
}

function addStock(req, res, next){
	let ticker = req.params.ticker;

	db.serialize(function() {

		db.get("SELECT * FROM stocks WHERE Ticker LIKE '" + ticker +"'", function(err, row) {
			if (row == null){
				request("https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + ticker +"&interval=5min&apikey=LQLHQ491NM8JFP72", function(err, resp, pricesBody){

					//Verifying that the request worked
					if (JSON.parse(pricesBody)['Error Message']){
						res.status(404).json({"text":"Stock with ticker \"" + ticker + "\" does not exist"});
					}else if (pricesBody != null){

						request("https://www.alphavantage.co/query?function=OVERVIEW&symbol=" + ticker +"&apikey=LQLHQ491NM8JFP72", function(err, resp2, overviewBody){

							//Verifying that the request worked
							if (JSON.parse(overviewBody)['Error Message']){
								res.status(404).json(
									{"text":"Stock with ticker \"" + ticker + "\" may be an ETF and not a stock, we could not get enough information about it to add it to our database"}
								);
							}else if (overviewBody != null){
								let combinedResponse = {};

								combinedResponse["Prices"] = JSON.parse(pricesBody);
								combinedResponse["Overview"] = JSON.parse(overviewBody);

								db.run("INSERT INTO stocks VALUES('" +
									ticker + "', '" +
									combinedResponse["Overview"]["Exchange"] + "', " +
									parseFloat(combinedResponse["Prices"]["Time Series (5min)"][combinedResponse["Prices"]["Meta Data"]["3. Last Refreshed"]]["4. close"]).toFixed(2) + ", " +
									(combinedResponse["Overview"]["DividendYield"] * 100) + ", " +
									combinedResponse["Overview"]["52WeekHigh"] + ", " +
									combinedResponse["Overview"]["52WeekLow"] + ")",
									function(){
										res.status(201).json({"text": "Stock " + combinedResponse["Overview"]["Name"] + " has been found and added to the database."});
								});
							}else{
								console.log("there was an error with the request");
								send404(res);
							}
						});

					}else{
						console.log("there was an error with the request");
						send404(res);
					}
				});
			}else{
				res.status(409).json({"text":"Stock " + ticker + " is already in the database, use update to get a new quote for this stock."});
			}
		});
	});
}

function removeStock(req, res, next){
	let ticker = req.params.ticker;

	db.run("DELETE FROM stocks WHERE Ticker LIKE '" + ticker + "'", function(){
		if (this["changes"] > 0){
			res.status(200).json({"text":"Stock " + ticker + " has been removed from the database."});
		}else{
			res.status(404).json({"text":"Stock " + ticker + " could not be found in the database."});
		}
	});
}

function updateStock(req, res, next){
	let ticker = req.params.ticker;

	db.serialize(function() {
		db.get("SELECT * FROM stocks WHERE Ticker LIKE '" + ticker + "'", function(err, row){
			if (row){
				request("https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + ticker +"&interval=5min&apikey=LQLHQ491NM8JFP72", function(err, resp, pricesBody){

					//Verifying that the request worked
					if (JSON.parse(pricesBody)['Error Message']){
						res.status(404).json({"text":"Stock with ticker \"" + ticker + "\" does not exist"});
					}else if (pricesBody != null){

						request("https://www.alphavantage.co/query?function=OVERVIEW&symbol=" + ticker +"&apikey=LQLHQ491NM8JFP72", function(err, resp2, overviewBody){

							//Verifying that the request worked
							if (JSON.parse(overviewBody)['Error Message']){
								res.status(404).json(
									{"text":"Stock with ticker \"" + ticker + "\" may be an ETF and not a stock, we could not get enough information about it to add it to our database"}
								);
							}else if (overviewBody != null){
								let combinedResponse = {};

								combinedResponse["Prices"] = JSON.parse(pricesBody);
								combinedResponse["Overview"] = JSON.parse(overviewBody);

								db.run("UPDATE stocks SET " +
									"Price = " + parseFloat(combinedResponse["Prices"]["Time Series (5min)"][combinedResponse["Prices"]["Meta Data"]["3. Last Refreshed"]]["4. close"]).toFixed(2) +
									", DivYield = " +(combinedResponse["Overview"]["DividendYield"] * 100) +
									", YearHigh = " + combinedResponse["Overview"]["52WeekHigh"] +
									", YearLow = " + combinedResponse["Overview"]["52WeekLow"] +
									" WHERE Ticker LIKE '" + ticker + "'",
									function(){
										res.status(200).json({"text": "Stock " + combinedResponse["Overview"]["Name"] + " has been found and updated in the database."});
								});
							}else{
								console.log("there was an error with the request");
								send404(res);
							}
						});

					}else{
						console.log("there was an error with the request");
						send404(res);
					}
				});
			}else{
				res.status(404).json({"text":"Stock " + ticker + " could not be found in the database."});
			}
		});
	});
}

function openAccount(req, res, next){
	if (req.session.loggedin){
		db.serialize(function() {
			//Getting list of all account nums to check agaisnt duplicates
			db.all("SELECT AcctNum FROM accounts", function(err, rows){

				let accountNum;
				let numUsed = true;

				//Looping until an unused account num is found
				while (numUsed){

					//Assuming account number hasn't been used until proven otherwise
					numUsed = false;

					accountNum = Math.floor(Math.random() * (99999 - 1) + 1).toString();

					let zeroStr = "0";

					while (accountNum.length < 5){
						accountNum = zeroStr.concat(accountNum);
					}

					//Going through existing account nums
					for (num in rows){
						if (rows[num]["AcctNum"] == accountNum){
							numUsed = true;
							break;
						}
					}
				}

				db.run("INSERT INTO accounts VALUES('" + accountNum + "', '" + req.query.Type + "', " + req.query.Balance + ")");
				db.run("INSERT INTO CustomerAccounts VALUES(" + req.session.SSN + ", '" + accountNum + "')",
					function(){
						res.status(201).json({"text": "New " + req.query.Type + " account opened with number: " + accountNum});
				});
			});
		});
	}
}

function buyStock(req, res, next){
	let ticker = req.query.ticker;
	let numShares = req.query.numShares;
	let acctNum = req.query.currAcct;

	request("https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + ticker +"&interval=5min&apikey=LQLHQ491NM8JFP72", function(err, resp, body){
		let prices = JSON.parse(body);

		//Verifying that the request worked
		if (prices['Error Message']){

			res.status(404).json(
				{"text":"Stock with ticker \"" + ticker + "\" does not exist"}
			);
		}else if (prices["Note"]){
			res.status(409).json(
				{"text":"Calls to API have been exceeded, please try purchasing again in a few minutes."}
			);
		}else if (prices != null){
			let totalCost = numShares * parseFloat(prices["Time Series (5min)"][prices["Meta Data"]["3. Last Refreshed"]]["4. close"]).toFixed(2);

			db.serialize(function(){
				//Checking that there is sufficient funds
				db.get("SELECT * FROM accounts WHERE AcctNum like '" + acctNum + "'", function(err, row) {
					if (row){
						if (row["Balance"] < totalCost){
							res.status(409).json(
								{"text":"Insufficient funds to make this transaction, try again with a lower number of shares."}
							);
						}else {
							//Updating the account balance
							db.run("UPDATE accounts SET Balance = " + (row["Balance"] - totalCost) + " WHERE AcctNum like '" + acctNum + "'");

							db.get("SELECT * FROM StocksInAccounts WHERE AcctNum like '" + acctNum + "' AND Ticker like '" + ticker + "'", function(err, row) {
								//Some shares of this stock already held
								if (row){
									let totalShares = parseInt(row["NumShares"]) + parseInt(numShares);
									let oldCost = parseInt(row["NumShares"]) * row["ShareCost"];
									let newCost = numShares * prices["Time Series (5min)"][prices["Meta Data"]["3. Last Refreshed"]]["4. close"];
									let newAvg = ((oldCost + newCost) / totalShares).toFixed(2);

									db.run("UPDATE StocksInAccounts SET " +
										"NumShares = " + totalShares +
										", ShareCost = " + newAvg +
										" WHERE Ticker LIKE '" + ticker + "'",
										function(){
											res.status(200).json({"text": numShares + " shares of stock " + ticker + " have been purchased at a price of $" +
																						parseFloat(prices["Time Series (5min)"][prices["Meta Data"]["3. Last Refreshed"]]["4. close"]).toFixed(2) +
																						" per share (total: " + newCost + ")"});
									});
								//No shares of this stock owned
								}else{
									//Request to get the exchange name
									request("https://www.alphavantage.co/query?function=OVERVIEW&symbol=" + ticker +"&apikey=LQLHQ491NM8JFP72", function(err, resp2, overviewBody){
										let overview = JSON.parse(overviewBody);

										if (overview["Note"]){
											res.status(409).json(
												{"text":"Calls to API have been exceeded, please try purchasing again in a few minutes."}
											);
										}else{
											db.run("INSERT INTO StocksInAccounts VALUES("+
												"'" + ticker +
												"', '" + overview["Exchange"] +
												"', '" + acctNum +
												"', " + numShares +
												", " + parseFloat(prices["Time Series (5min)"][prices["Meta Data"]["3. Last Refreshed"]]["4. close"]).toFixed(2) + ")",
												function(){
													let price = parseFloat(prices["Time Series (5min)"][prices["Meta Data"]["3. Last Refreshed"]]["4. close"]).toFixed(2);
													res.status(200).json({"text": numShares + " shares of stock " + ticker + " have been purchased at a price of $" +
																								price + " per share (total: " + (price * numShares) + ")"});
											});
										}
									});
								}
							});
						}
					}else{
						send404(res);
					}
				});
			});
		}else{
			console.log("there was an error with the request");
			send404(res);
		}
	});
}

function sellStock(req, res, next){
	let ticker = req.query.ticker;
	let numShares = req.query.numShares;
	let acctNum = req.query.currAcct;

	db.serialize(function(){
		//Checking that there is sufficient funds
		db.get("SELECT * FROM StocksInAccounts WHERE AcctNum like '" + acctNum + "' AND Ticker like '" + ticker + "'", function(err, row) {
			if (row["NumShares"] < numShares){
				res.status(409).json(
					{"text":"You own less shares of " + ticker + " than you have requested to sell."}
				);
			}else if (!row){
				res.status(404).json(
					{"text":"You do not own any shares of the stock with ticker \"" + ticker + "\"."}
				);
			}else{
				request("https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + ticker +"&interval=5min&apikey=LQLHQ491NM8JFP72", function(err, resp, body){
					let prices = JSON.parse(body);

					//Verifying that the request worked
					if (prices['Error Message']){
						res.status(404).json(
							{"text":"Stock with ticker \"" + ticker + "\" does not exist"}
						);
					}else if (prices["Note"]){
						res.status(409).json(
							{"text":"Calls to API have been exceeded, please try purchasing again in a few minutes."}
						);
					}else{
						let totalValue = numShares * parseFloat(prices["Time Series (5min)"][prices["Meta Data"]["3. Last Refreshed"]]["4. close"]).toFixed(2);

						db.get("SELECT * FROM accounts WHERE AcctNum like '" + acctNum + "'", function(err, balRow) {
							//Updating the account balance
							db.run("UPDATE accounts SET Balance = " + (balRow["Balance"] + totalValue) + " WHERE AcctNum like '" + acctNum + "'");

							if (row["NumShares"] == numShares){
								db.run("DELETE FROM StocksInAccounts WHERE Ticker LIKE '" + ticker + "'",
									function(){
										res.status(200).json({"text": "All shares of stock " + ticker + " (" + numShares + " shares) have been sold at a price of " +
																					parseFloat(prices["Time Series (5min)"][prices["Meta Data"]["3. Last Refreshed"]]["4. close"]).toFixed(2) +
																					" per share (total: $" + totalValue + ")"});
								});
							}else{
								db.run("UPDATE StocksInAccounts SET " +
									"NumShares = " + (row["NumShares"] - numShares) +
									" WHERE Ticker LIKE '" + ticker + "'",
									function(){
										res.status(200).json({"text": numShares + " shares of stock " + ticker + " have been sold at a price of " +
																					parseFloat(prices["Time Series (5min)"][prices["Meta Data"]["3. Last Refreshed"]]["4. close"]).toFixed(2) +
																					" per share (total: $" + totalValue + ")"});
								});
							}
						});
					}
				});
			}
		});
	});
}

function updateBalance(req, res, next){
	let amount = req.query.amount;
	let acctNum = req.query.currAcct;

	db.get("SELECT * FROM accounts WHERE AcctNum like '" + acctNum + "'", function(err, row) {
		if (row){
			db.run("UPDATE accounts SET Balance = " + (row["Balance"] + parseFloat(amount)) + " WHERE AcctNum like '" + acctNum + "'",
				function(){
					if (amount > 0){
						res.status(200).json({"text": "$" + amount + " has been deposited into account " + acctNum});
					}else{
						res.status(200).json({"text": "$" + (parseFloat(amount) * -1) + " has been withdrawn from account " + acctNum});
					}
				}
			);
		}else{
			res.status(404).json({"text":"Account not found."});
		}
	});
}

//Helper function for sending 404 message
function send404(response) {
	response.writeHead(404, { 'Content-Type': 'text/plain' });
	response.write('Error 404: Resource not found.');
	response.end();
}


//Specifying the port for the server to run on
app.listen(3000);
console.log('server running on port 3000');

let recommenderMatrix = {};

function createMatrix(){
	db.all("SELECT Ticker, SSN, ExName FROM StocksInAccounts NATURAL JOIN CustomerAccounts;", function(err, rows) {
		for (row in rows){
			if (!recommenderMatrix[rows[row]["SSN"]]){
				recommenderMatrix[rows[row]["SSN"]] = {};
			}
			let str = [rows[row]["Ticker"]] + "(" + [rows[row]["ExName"]] + ")"
			recommenderMatrix[rows[row]["SSN"]][str] = 1;
		}
		//console.log(recommenderMatrix)
		//console.log("recommendations: ", getRecommendations("444555666", 5, "444555666"));
	});
}

function recommendationRequest(req, res, next){
		let user = req.session.SSN;
		let name;

		db.get("SELECT * FROM customers WHERE SSN like '" + user + "'", function(err, row) {
			name = row["Name"];
		});

		let result = getRecommendations(user, 3, user);
		setTimeout(function(){
			let resultList = [];

			for (stock in result) {
				resultList.push({"name" : stock, "count" : result[stock]});
			}

			resultList.sort(function(a,b){return b["count"] - a["count"]});
			res.render("Recommendations.pug", {resultList: resultList, name : name})
		}, 100);
}

//Returns a list of recommended stocks for the user (based on their unique SSN)
//Pathlength should be an odd number
function getRecommendations(SSN, pathLength, originalSSN){
	if (!recommenderMatrix[SSN]){
		return -1;
	}

	let recommendations = {};

	for (stock in recommenderMatrix[SSN]){
		for (user in recommenderMatrix){
			if (user != SSN && recommenderMatrix[user][stock] && user != originalSSN){
				for (newStock in recommenderMatrix[user]){
					if (!(newStock in recommenderMatrix[SSN])){
						if (recommendations[newStock]){
							recommendations[newStock]++;
						}else{
							recommendations[newStock] = 1;
						}
					}
				}
			}

			if (pathLength > 3){
				let nextRecommendations = getRecommendations(user, pathLength - 2, originalSSN);

				for (rec in nextRecommendations){
					if (recommendations[rec]){
						recommendations[rec] += nextRecommendations[rec];
					}else{
						recommendations[rec] = nextRecommendations[rec];
					}
				}
			}
		}
	}

	return recommendations;
}

createMatrix();

function transferUsers(){
		db.all("SELECT Name, PWord FROM Customers;", function(err, rows) {
			mondb.collection("users").insertMany(rows, function(err, result){
				console.log("inserted")
			});
		});
}
