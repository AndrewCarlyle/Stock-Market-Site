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
