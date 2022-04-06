let loggedin = false;

function logout(){
  let request = new XMLHttpRequest();
  request.open("POST", "/Accounts/Logout");
  request.send();

  request.onreadystatechange = function(){
    if (this.readyState==4){
      window.location.href = "/Accounts.html";
    }
  };
}

//Requests the status of the current user's session (logged in or not)
function sessionStatus(){
  let request = new XMLHttpRequest();
  request.open("GET", "/Accounts/Session");
  request.send();

  request.onreadystatechange = function(){
    if (this.readyState==4 && this.status == 200){
      let response = JSON.parse(this.responseText);

      if (response["Status"] == true){
        if (window.location.href.endsWith("Accounts") || window.location.href.endsWith("Accounts.html")){
          //Redirect
          window.location.href = "/Accounts/List"
        }else{
          let btnLogout = document.createElement("button");
          btnLogout.id = "btnLogout";
          btnLogout.innerHTML = "Logout";
          btnLogout.onclick = logout;
          document.getElementById("head").appendChild(btnLogout);
          btnLogout.style = "height: 30px; width: 75px; position: relative; top: 10px; left: 20%";

          let lblName = document.createElement("a");
          lblName.innerHTML = "\nlogged in as:\n" + response["Name"];
          document.getElementById("head").appendChild(lblName);
          lblName.style = "font-size: 18px; position: relative; top: 50px; left: 8%";
        }
      }
    }
  }
}
