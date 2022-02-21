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
      alert("Please enter a valid amount.")
    }else{
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
}

//Requests a list of stock recommendations for the user
function getRecommendations(){
  window.location.href = "/Accounts/Recommendations";
}
