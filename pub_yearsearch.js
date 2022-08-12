//Search all parameters in the main database table
function bigsearch() {
  // Declare variables 
  
  var table, tr, td, i;
  
  var checkBox2022 = document.getElementById("tick2022");
  var checkBox2021 = document.getElementById("tick2021");
  var checkBox2020 = document.getElementById("tick2020");
  var checkBox2019 = document.getElementById("tick2019");
  
  var checkBox2018 = document.getElementById("tick2018");
  var checkBox2017 = document.getElementById("tick2017");
  var checkBox2016 = document.getElementById("tick2016");
  var checkBox2015 = document.getElementById("tick2015");
    
  var checkBox2014 = document.getElementById("tick2014");
  var checkBox2013 = document.getElementById("tick2013");
  var checkBox2012 = document.getElementById("tick2012");
  var checkBox2011 = document.getElementById("tick2011");





  table = document.getElementById("publication_table");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    td1 = tr[i].getElementsByTagName("td")[2];  //year

    if ((checkBox2022.checked == true 
      && checkBox2021.checked == false
      && checkBox2020.checked == false
      && checkBox2019.checked == false)
      ) {
    if (td1) {
      if ((td1.innerHTML == 2022
        && td1.innerHTML !== 2021
        && td1.innerHTML !== 2020
        && td1.innerHTML !== 2019)
        ) {
        
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
    }

    else if ((checkBox2022.checked == false 
      && checkBo2021.checked == true
      && checkBox2020.checked == false
      && checkBox2019.checked == false)
      ) {
    if (td1) {
      if ((td1.innerHTML !== 2022
        && td1.innerHTML == 2021
        && td1.innerHTML !== 2020
        && td1.innerHTML !== 2019)
        ) {
        
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
    }

  }



}