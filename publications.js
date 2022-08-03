//Open Data in the form of a CSV file
//Based on code from: https://www.webslesson.info/2017/04/csv-file-to-html-table-using-ajax-jquery.html
$(document).ready(function(){
 $('#load_data').ready(function(){
  $.ajax({
   //url:"dataset/MBData_short.csv",
   url:"MB_data.txt",
   dataType:"text",
   success:function(data)
   {
    var employee_data = data.split(/\r?\n|\r/);
    var table_data = '<table id="myTable" class="datatable">';
    for(var count = 0; count<employee_data.length; count++)
    {
     var cell_data = employee_data[count].split("\t")-13;
     table_data += '<tr>';
     for(var cell_count=0; cell_count<cell_data.length; cell_count++)
     {
      if(count === 0)
      {
       table_data += '<th>'+cell_data[cell_count]+'</th>';
      }
      else
      {
       table_data += '<td>'+cell_data[cell_count]+'</td>';
      }
     }
     table_data += '</tr>';
    }
    table_data += '</table>';
    $('#MBData_table').html(table_data);
   }
  });
 });
 
});

// END CSV Load