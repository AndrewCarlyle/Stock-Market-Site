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
      console.log(response)
      if (response["Status"] == true){
        //Add logout btn
        let btnLogout = document.createElement("button");
        btnLogout.id = "btnLogout";
        btnLogout.innerHTML = "Logout";
        btnLogout.onclick = logout;
        document.getElementById("infoDiv").appendChild(btnLogout);
      }
    }
  };
}
