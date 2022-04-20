function loadStocks(){
  //Posting the username and password to the server
  let request = new XMLHttpRequest();
  request.open("GET", "/Stocklist/Quote");
  request.send();

  request.onreadystatechange = function() {
    if(this.readyState==4 && this.status == 200){

      //Getting the response
      let response = JSON.parse(this.responseText);

      let slMainDiv = document.getElementById("slMainDiv");

      slMainDiv.remove();

      slMainDiv = document.createElement("div");
      slMainDiv.id = "slMainDiv";
      slMainDiv.style = "white-space: pre;"

      //Formatting
      slMainDiv.appendChild(document.createTextNode("\n"));

      for (stock in response){
        let stockName = document.createElement('a');
        stockName.innerHTML = response[stock]["ExName"] + ":" + response[stock]["Ticker"];
        stockName.href = "/Stocklist/Info/" + response[stock]["ticker"];

        let newStock = document.createElement('a');
        newStock.innerHTML = stockToString(response[stock]);

        slMainDiv.appendChild(stockName);
        slMainDiv.appendChild(newStock);
      }

      document.body.appendChild(slMainDiv);
    }
  }
}

function stockToString(stock, currPrice){
  return "\n     Current Price: $" + stock["Price"] +
         "\n     52 Week High: $" + stock["YearHigh"] +
         "\n     52 Week Low: $" + stock["YearLow"] +
         "\n     Dividend Yield: " + stock["DivYield"] +
         "\n\n";
}

function addStock(){
  let stockTicker = prompt("Please enter the stock ticker that you wish to add:").toUpperCase();

  let request = new XMLHttpRequest();
  request.open("POST", "/Stocklist/AddStock/" + stockTicker);
  request.send();

  request.onreadystatechange = function() {
    if(this.readyState==4 && this.status == 201){

      //Getting the response
      let response = JSON.parse(this.responseText);

      loadStocks();

      alert(response["text"]);

    }else if (this.readyState == 4 && (this.status == 404 || this.status == 409)){
      alert(JSON.parse(this.responseText)["text"]);
    }
  }
}

function updateStock(){
  let stockTicker = prompt("Please enter the stock ticker that you wish to update:").toUpperCase();
  let exchange = prompt("Please enter the exchange that this stock is on:").toUpperCase();

  let request = new XMLHttpRequest();
  request.open("POST", "/Stocklist/UpdateStock/?ticker=" + stockTicker + "&exchange=" + exchange);
  request.send();

  request.onreadystatechange = function() {
    if(this.readyState==4 && this.status == 200){

      //Getting the response
      let response = JSON.parse(this.responseText);

      loadStocks();

      alert(response["text"]);

    }else if (this.readyState == 4 && this.status == 404){
      alert(JSON.parse(this.responseText)["text"]);
    }
  }
}

function removeStock(){
  let stockTicker = prompt("Please enter the stock ticker that you wish to remove:").toUpperCase();

  let request = new XMLHttpRequest();
  request.open("POST", "/Stocklist/RemoveStock/" + stockTicker);
  request.send();

  request.onreadystatechange = function() {
    if(this.readyState==4 && this.status == 200){

      //Getting the response
      let response = JSON.parse(this.responseText);

      loadStocks();

      alert(response["text"]);

    }else if (this.readyState == 4 && this.status == 404){
      alert(JSON.parse(this.responseText)["text"]);
    }
  }
}
