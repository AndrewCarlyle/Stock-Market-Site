let loggedin = false;

function logout(){
  /*let request = new XMLHttpRequest();
  request.open("POST", "/Accounts/Logout");
  request.send();*/

  window.location.href = '/Accounts/Logout';
}
