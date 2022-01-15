let un, pw, sin, currAcct;

//Sends a request to check the database to see if user provided correct username/password
function validateUser(){
  un = document.getElementById("username").value;
  pw = document.getElementById("password").value;

  //Posting the username and password to the server
  let request = new XMLHttpRequest();
  request.open("POST", "/Accounts/Login?name="+un+"&pass="+pw);
  request.send();

  request.onreadystatechange = function() {
    if(this.readyState==4 && this.status == 200){

      //Getting the response
      let response = JSON.parse(this.responseText);
      let accounts = response["accounts"];
      console.log(response)
      sin = response["sin"];

      //Clearing away the buttons and UN/PW fields
      let infoDiv = document.getElementById("infoDiv");
      infoDiv.remove();

      let mainDiv = document.getElementById("mainDiv");
      let accountList = document.createElement("div");

      accountList.id = "accountList";

      let count = 0;

      for (act in accounts){
        let link = document.createElement('account');
        let lblAccount = document.createTextNode("\n" + accounts[count]["Type"] + " (" + accounts[count]["AcctNum"] + ")");
        let lblBalance = document.createTextNode("\n      Balance: $" + accounts[count]["Balance"] + "\n");
        link.cnt = count;

        link.onclick = function (){

          currAcct = accounts[link.cnt]["AcctNum"];

          let req = new XMLHttpRequest();
          req.open("GET", "/Accounts/" + accounts[link.cnt]["AcctNum"]);
          req.send();

          req.onreadystatechange = function(){
            if (this.readyState==4 && this.status == 200){
              displayAccount(JSON.parse(this.responseText), accounts[link.cnt]["Balance"]);
            }
          };
        };

        link.appendChild(lblAccount);

        accountList.appendChild(link);
        accountList.appendChild(lblBalance);

        mainDiv.appendChild(accountList);

        count++;
      }
      let btnRecommendations = document.createElement("button");
      btnRecommendations.id = "btnRecommendations";
      btnRecommendations.innerHTML = "Get Recommendations";
      btnRecommendations.onclick = getRecommendations;
      mainDiv.appendChild(btnRecommendations);

      displayOpenAccountOption("old");

    }else if(this.readyState==4 && this.status == 401){
      let response = JSON.parse(this.responseText);
      alert(response["text"]);
    }
  }
}

//Requests a list of stock recommendations for the user
function getRecommendations(){
  window.location.href = "/Accounts/Recommendations?SSN="+sin;
}

//Take the result of a request and diplays the information provided for the requested account
function displayAccount(resText, cash){

    let mainDiv = document.getElementById("mainDiv");
    document.getElementById("mainDiv").remove();

    let newDiv = document.createElement("div");
    newDiv.id = "mainDiv";
    newDiv.stocks = true;
    document.body.appendChild(newDiv);

    //Changing the html file so that white space is NOT ignored
  	newDiv.style = "white-space: pre;"

    let btnDeposit = document.createElement("button");
    btnDeposit.innerHTML = "Make a deposit";
    btnDeposit.onclick = makeDeposit;
    newDiv.appendChild(btnDeposit);

    let btnWithdraw = document.createElement("button");
    btnWithdraw.innerHTML = "Make a withdrawal";
    btnWithdraw.onclick = makeWithdrawal;
    newDiv.appendChild(btnWithdraw);

    let btnBuy = document.createElement("button");
    btnBuy.innerHTML = "Buy a stock";
    btnBuy.onclick = buyStock;
    newDiv.appendChild(btnBuy);

    let btnSell = document.createElement("button");
    btnSell.innerHTML = "Sell a stock";
    btnSell.onclick = sellStock;
    newDiv.appendChild(btnSell);

    let accountTotals = document.createElement("div");
    let marketValue = document.createElement("div");
    let cashValue = document.createElement("div");
    let totalEquity = document.createElement("div");

    accountTotals.id = "accountTotals";
    marketValue.id = "marketValue";
    cashValue.id = "cashValue";
    totalEquity.id = "totalEquity";

    cashValue.innerHTML = "Cash Value: $" + cash;

    accountTotals.appendChild(marketValue);
    accountTotals.appendChild(cashValue);
    accountTotals.appendChild(totalEquity);

    newDiv.appendChild(accountTotals);

    let marketValCount = 0;

    for (i=0; i<resText.length; i++){

      //Making a request to get a stock quote
      let stockRequest = new XMLHttpRequest();
      stockRequest.open("GET", "/Stocklist/Quote/" + resText[i]["Ticker"]);
      stockRequest.send();

      //Storing the index within this iteration of the loop, as the onreadystatechange function
      //Executes after this for loop is done executing (so i become out of bounds from resText)
      let cur = i;

      stockRequest.onreadystatechange = function() {
        if(this.readyState==4 && this.status == 200){

          //Getting the response
          let response = JSON.parse(this.responseText);

          //Checking to make sure the ticker was valid
          if (response['Error Message']){
            alert("Not a valid ticker");
          }else if (response["Note"]){
            alert("number of calls to the API has been exceeded");

            let stockNode = document.createTextNode(toString(resText[cur], 0));
            newDiv.appendChild(stockNode);
          }else if (response["Meta Data"]){
            let mostRecent = response["Meta Data"]["3. Last Refreshed"];

            //Displaying the ticker/price
            let currPrice = parseFloat(response["Time Series (5min)"][mostRecent]["4. close"]).toFixed(2);

            let stockNode = document.createTextNode(toString(resText[cur], currPrice));
            newDiv.appendChild(stockNode);

            marketValCount += currPrice * resText[cur]["NumShares"];

            marketValue.innerHTML = "\nMarket Value: $" + marketValCount.toFixed(2);
            totalEquity.innerHTML = "Total Equity: $" + (marketValCount + parseFloat(cash)).toFixed(2) + "\n\n";
          }else{
            let currPrice = response["Price"];

            let stockNode = document.createTextNode(toString(resText[cur], currPrice));
            newDiv.appendChild(stockNode);

            marketValCount += currPrice * resText[cur]["NumShares"];

            marketValue.innerHTML = "\nMarket Value: $" + marketValCount.toFixed(2);
            totalEquity.innerHTML = "Total Equity: $" + (marketValCount + parseFloat(cash)).toFixed(2) + "\n\n";
          }
        }else if (this.readyState==4){
          alert(JSON.parse(this.responseText)["text"]);
        }
      }
    }
}

//Takes a stock object and converts it to a string
function toString(stock, currPrice){

  return stock["ExName"] + ":" + stock["Ticker"] +
  " Shares Owned: " + stock["NumShares"] +
  "\n     Average Cost: $" + stock["ShareCost"] +
  "\n     Total Cost: $" + (stock["NumShares"] * stock["ShareCost"]).toFixed(2) +
  "\n     Current Price: $" + currPrice +
  "\n     Total Value: $" + (stock["NumShares"] * currPrice).toFixed(2) +
  "\n     Profit/Loss: $" + ((currPrice - stock["ShareCost"]) * stock["NumShares"]).toFixed(2) + "\n\n";
}

//Adds the user and their password to the database
function createUser(){

  //Storing user's input
  un = document.getElementById("username").value;
  pw = document.getElementById("password").value;

  //Checking for valid Input
  if (un == "" || pw == ""){
    alert("Please fill out the username and password fields");
    return;
  }

  //Clearing away the buttons and UN/PW fields
  let infoDiv = document.getElementById("infoDiv");
  infoDiv.remove();

  let mainDiv = document.getElementById("mainDiv");

  //Creating the submit button
  let btnSubmit = document.createElement("button");
  btnSubmit.innerHTML = "Submit";
  btnSubmit.onclick = submitUserInfo;

  let lblSin = document.createTextNode("SIN: ");
  let lblAddress = document.createTextNode("Address: ");

  let txtSin = document.createElement("Input");
  txtSin.id = "txtSin";
  let txtAddress = document.createElement("Input");
  txtAddress.id = "txtAddress"

  let lblDay = document.createTextNode("Date of birth:\n  Day: ");
  let lblMonth = document.createTextNode("  Month: ");
  let lblYear = document.createTextNode(" Year: ");

  let choiceDay = document.createElement("select");
  choiceDay.id = "choiceDay";
  let choiceMonth = document.createElement("select");
  choiceMonth.id = "choiceMonth";
  let choiceYear = document.createElement("select");
  choiceYear.id = "choiceYear";

  const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  for (i=0; i<13; i++){
    let option = document.createElement("option");
    if (i<10){
      option.value = "0"+i;
    }else{
      option.value = i;
    }
    option.text = months[i];
    choiceMonth.appendChild(option);
  }

  //Creating a blank first option
  let blankOptionDay = document.createElement("option");
  blankOptionDay.value = "";
  blankOptionDay.text = "";
  choiceDay.appendChild(blankOptionDay);

  //Creating a blank first option
  let blankOptionYear = document.createElement("option");
  blankOptionYear.value = "";
  blankOptionYear.text = "";
  choiceYear.appendChild(blankOptionYear);

  for (i=1; i<32; i++){
    let option = document.createElement("option");
    if (i<10){
      option.value = "0"+i;
    }else{
      option.value = i;
    }
    option.text = i;
    choiceDay.appendChild(option);
  }

  for (i=2021; i>1899; i--){
    let option = document.createElement("option");
    option.value = i;
    option.text = i;
    choiceYear.appendChild(option);
  }

  mainDiv.appendChild(lblSin);
  mainDiv.appendChild(txtSin);
  mainDiv.appendChild(document.createTextNode("\n"));
  mainDiv.appendChild(document.createTextNode("\n"));
  mainDiv.appendChild(lblAddress);
  mainDiv.appendChild(txtAddress);
  mainDiv.appendChild(document.createTextNode("\n"));
  mainDiv.appendChild(document.createTextNode("\n"));
  mainDiv.appendChild(lblDay);
  mainDiv.appendChild(choiceDay);
  mainDiv.appendChild(lblMonth);
  mainDiv.appendChild(choiceMonth);
  mainDiv.appendChild(lblYear);
  mainDiv.appendChild(choiceYear);
  mainDiv.appendChild(document.createTextNode("\n"));
  mainDiv.appendChild(document.createTextNode("\n"));
  mainDiv.appendChild(btnSubmit);

}

//Function that submits user info to create an account
function submitUserInfo(){

  sin = document.getElementById("txtSin").value;
  let address = document.getElementById("txtAddress").value;

  let day = document.getElementById("choiceDay").value;
  let month = document.getElementById("choiceMonth").value;
  let year = document.getElementById("choiceYear").value;

  if (sin == "" || address == "" || day == "" || month == "" || year == ""){
    alert("Please finish filling in your information.");
    return;
  }

  let reqBody = {un, pw, sin, address, DOB:day + "-" + month + "-" + year};

  //Making a request to post the users info and create their profile
  let request = new XMLHttpRequest();
  request.open("POST", "/Accounts/CreateProfile");
  request.setRequestHeader("Content-Type", "application/json");
  request.send(JSON.stringify(reqBody));

  //Executed once a response is recieved
  request.onload = function(){

    //Showing the user the response
    alert(JSON.parse(request.response)["text"]);

    displayOpenAccountOption("new");
  }
}

function displayOpenAccountOption(context){
  let mainDiv = document.getElementById("mainDiv");

  if (context == "new"){
    mainDiv.remove();

    mainDiv = document.createElement("div");
    mainDiv.id = "mainDiv";

    document.body.appendChild(mainDiv);
  }

  let accountTypeText = document.createTextNode("\n\nReady to open a new account? Please select \nthe type for your first account: ");
  accountTypeText.id = "accountTypeText";
  let accountTypeSelect = document.createElement("select");
  accountTypeSelect.id = "accountTypeSelect";

  //Creating a blank first option
  let blankOption = document.createElement("option");
  blankOption.value = "";
  blankOption.text = "";
  accountTypeSelect.appendChild(blankOption);

  let optionStrs = ["TFSA", "RRSP", "RRIF", "LIRA", "RESP", "Cash"];

  for (i in optionStrs){
    let option = document.createElement("option");

    option.value = optionStrs[i];
    option.text = optionStrs[i];
    accountTypeSelect.appendChild(option);
  }

  let btnSubmit = document.createElement("button");
  btnSubmit.onclick = openAccount;
  btnSubmit.innerHTML = "Open Account";

  mainDiv.appendChild(accountTypeText);
  mainDiv.appendChild(accountTypeSelect);
  mainDiv.appendChild(btnSubmit);
}

function openAccount(){
  let selectedType = document.getElementById("accountTypeSelect").value;

  if (!selectedType){
    alert("You must select the type of account that you wish to open.")
    return;
  }else{
    let initialDeposit = prompt("How much money would you like to provide as initial funding?", "$0");

    //Checking the format of the input
    if (initialDeposit.charAt(0) == "$"){
      initialDeposit = initialDeposit.slice(1, initialDeposit.length);
    }
    if (isNaN(initialDeposit) || initialDeposit < 0){
      initialDeposit = 0;
    }

    //Making a request to get a stock quote
    let request = new XMLHttpRequest();
    request.open("POST", "/Accounts/OpenAccount?Type=" + selectedType + "&Balance=" + initialDeposit + "&sin=" + sin);
    request.send();

    request.onreadystatechange = function() {
      if(this.readyState==4){
        alert(JSON.parse(this.responseText)["text"]);
      }
    }
  }
}

function buyStock(){
  let ticker = prompt("What is the ticker of the stock you would like to buy?").toUpperCase();
  let numShares = prompt("How many shares would you like to buy?");

  if (!ticker || isNaN(numShares) || numShares < 1){
    alert("Invalid information for buying a stock. Please try again.");
    return;
  }

  let purchaseRequest = new XMLHttpRequest();
  purchaseRequest.open("POST", "/Accounts/Buy?ticker=" + ticker + "&numShares=" + numShares + "&currAcct=" + currAcct);
  purchaseRequest.send();

  purchaseRequest.onreadystatechange = function() {
    if(this.readyState==4 && this.status == 200){
      alert(JSON.parse(this.responseText)["text"]);

      let req = new XMLHttpRequest();
      req.open("GET", "/Accounts/" + currAcct);
      req.send();

      req.onreadystatechange = function(){
        if (this.readyState==4 && this.status == 200){
          displayAccount(JSON.parse(this.responseText), currAcct);
        }
      };
    }else if (this.readyState==4){
      alert(JSON.parse(this.responseText)["text"]);
    }
  }
}

function sellStock(){
  let ticker = prompt("What is the ticker of the stock you would like to sell?");
  let numShares = prompt("How many shares would you like to sell?");

  if (!ticker || isNaN(numShares) || numShares < 1){
    alert("Invalid information for selling a stock. Please try again.");
    return;
  }

  let sellRequest = new XMLHttpRequest();
  sellRequest.open("POST", "/Accounts/Sell?ticker=" + ticker + "&numShares=" + numShares + "&currAcct=" + currAcct);
  sellRequest.send();

  sellRequest.onreadystatechange = function() {
    if(this.readyState==4 && this.status == 200){
      alert(JSON.parse(this.responseText)["text"]);
    }else if (this.readyState==4){
      alert(JSON.parse(this.responseText)["text"]);
    }
  }
}

function makeDeposit(){
  let amount = prompt("How much would you like to deposit?");

  updateAccountBalance(amount);
}

function makeWithdrawal(){
  let amount = prompt("How much would you like to withdraw?");

  updateAccountBalance(amount * -1);
}

function updateAccountBalance(amount){
  if (isNaN(amount)){
    let request = new XMLHttpRequest();
    request.open("POST", "/Accounts/AdjustBalance?amount=" + amount + "&currAcct=" + currAcct);
    request.send();

    request.onreadystatechange = function() {
      if(this.readyState==4 && this.status == 200){
        alert(JSON.parse(this.responseText)["text"]);
      }else if (this.readyState == 4){
        alert(JSON.parse(this.responseText)["text"]);
      }
    }
  }else{
    alert("Please enter a valid number.");
  }
}
