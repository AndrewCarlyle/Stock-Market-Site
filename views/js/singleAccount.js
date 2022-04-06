let currAcct;

function setAcctNum(){
  currAcct = document.getElementById("head").getAttribute("num");
}

function buyStock(){
  let ticker = prompt("What is the ticker of the stock you would like to buy?").toUpperCase();
  let exchange = prompt("What exchange is this stock on?").toUpperCase();
  let numShares = prompt("How many shares would you like to buy?");

  if (!ticker || isNaN(numShares) || numShares < 1){
    alert("Invalid information for buying a stock. Please try again.");
    return;
  }

  let purchaseRequest = new XMLHttpRequest();
  purchaseRequest.open("POST", "/Accounts/Buy?ticker=" + ticker + "&numShares=" + numShares + "&AcctNum=" + currAcct + "&exchange=" + exchange);
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
  let ticker = prompt("What is the ticker of the stock you would like to sell?").toUpperCase();
  let exchange = prompt("What exchange is this stock on?").toUpperCase();
  let numShares = prompt("How many shares would you like to sell?");

  if (!ticker || isNaN(numShares) || numShares < 1){
    alert("Invalid information for selling a stock. Please try again.");
    return;
  }

  let sellRequest = new XMLHttpRequest();
  sellRequest.open("POST", "/Accounts/Sell?ticker=" + ticker + "&numShares=" + numShares + "&AcctNum=" + currAcct + "&exchange=" + exchange);
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
  //updateAccountBalance(amount);
}

function makeWithdrawal(){
  let amount = prompt("How much would you like to withdraw?");

  updateAccountBalance(amount * -1);
}

function updateAccountBalance(amount){
  if (!isNaN(amount)){
    let request = new XMLHttpRequest();
    request.open("POST", "/Accounts/AdjustBalance?amount=" + amount + "&AcctNum=" + currAcct);
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
