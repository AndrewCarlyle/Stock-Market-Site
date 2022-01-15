let td = document.getElementById("tickerDiv");
let pd = document.getElementById("priceDiv");

function init(){

}

//Function that takes user input and on the click of a button gets the price from
//google finance and displays it
function getTicker(){

  //Making a request to get a stock quote
  let request = new XMLHttpRequest();
  request.open("GET", "/Stocklist/Quote/"+document.getElementById("tickerBox").value.toUpperCase());
  request.send();

  request.onreadystatechange = function() {
    if(this.readyState==4 && this.status == 200){

      //Getting the response
      let response = JSON.parse(this.responseText);

      //Checking to make sure the ticker was valid
      if (response['Error Message']){
        alert("Not a valid ticker");

        //Clearing the previous data
        td.innerHTML = "Ticker: ";
        pd.innerHTML = "Price: $";
      }else{
        let mostRecent = response["Meta Data"]["3. Last Refreshed"]
        console.log("Price: " + response["Time Series (5min)"][mostRecent]["4. close"]);

        //Displaying the ticker/price
        td.innerHTML = "Ticker: " + response["Meta Data"]["2. Symbol"];
        pd.innerHTML = "Price: $" + response["Time Series (5min)"][mostRecent]["4. close"];
      }
    }
  }

}
