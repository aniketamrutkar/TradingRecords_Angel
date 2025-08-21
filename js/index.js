const _ = require ("underscore");
const fs = require('fs');
const moment = require("moment"); 

var data_pew = JSON.parse(fs.readFileSync('./data/response-pew.json', 'utf-8')).data;
var data_jpw = JSON.parse(fs.readFileSync('./data/response-jpw.json', 'utf-8')).data;
 var date = moment().format('DD-MMM-YYYY');
 var month = moment().format('MMM-YYYY')
 var outputFile = './bkp/'+month+"/"+date+'.txt';
 //var outputFile = date+'.txt';
var newBuyData = [];
var newSellData = [];
var getData = function(data, divideByTwo, date){
  var buyData = [], sellData =[];
  var client_code = divideByTwo==true?"W1573":"J77302";
  // Filter only completed transactions
  var completedData = data.filter(function(trade) {
    return trade.status === "complete" && parseInt(trade.filledshares) > 0;
  });
  var groupByTransanction = _.groupBy(completedData,'transactiontype');
  //console.log(groupByTransanction);
  Object.keys(groupByTransanction).forEach(function(eachSaleType){
    
    var groupByOrder = _.groupBy(groupByTransanction[eachSaleType],"orderid");
    Object.keys(groupByOrder).forEach(function(eachOrder){
      //console.log(eachOrder);
      var totalqty = 0;
      var smbl = "";
      var exchange = "";
      var price = 0;
      var nestordernumber= "";
      var trade_time= "";
      var trade_type="";
        groupByOrder[eachOrder].forEach(function(trade){
          //console.log(trade)
          totalqty+= parseInt(trade.filledshares);
          smbl = trade.tradingsymbol.trim().replace("-EQ", "");
          exchange = trade.exchange === "NSE" ? "N" : "B";
          price = trade.averageprice;
          nestordernumber = trade.orderid;
          trade_time=moment(trade.exchtime, "DD-MMM-YYYY HH:mm:ss").format("YYYY-MM-DD");
          trade_type = trade.producttype;
        });
        totalqty = divideByTwo == true ? totalqty/2 : totalqty;
        
        if(eachSaleType === "BUY"){
        buyData.push([date,smbl,price,totalqty]);
        newBuyData.push({
          "clientId":client_code,                      
          "transactionType":eachSaleType,
          "securityId":smbl,
          "quantity":totalqty,
          "price":price,
          "exchange":exchange,
          "refId":nestordernumber,
          "tradeTime":trade_time.split(" ")[0],
          "tradeType":trade_type,
          "isActive":true
        });
        }else{
        sellData.push([date,smbl,price,totalqty]);
        newSellData.push({
          "clientCode":client_code,                      
          "transactionType":eachSaleType,
          "securityId":smbl,
          "quantity":totalqty,
          "price":price,
          "exchange":exchange,
          "refId":nestordernumber,
          "tradeTime":trade_time.split(" ")[0],
          "tradeType":trade_type,
          "isActive":true
        });
        }
      });
    });
  var data = "";
  data+="Buy Data ===========\n"
  data+=buyData.sort(sortFunction).join("\n")
  data+= ("\n======TOTAL BUY======\n");
  data+= getSum(buyData, divideByTwo)
  data+="\nSell Data ===========\n"
  data+=sellData.sort(sortFunction).join("\n")
  data+= ("\n======TOTAL SELL======\n");
  data+= getSum(sellData, divideByTwo)
  //console.log(JSON.stringify(newData));
  return data;

}

var fileData = "";
fileData+= ("=============PEW=============\n");
//console.log(data_pew);
fileData+= getData(data_pew, true, date);
fileData+=("\n=============JPW=============\n");
fileData+=getData(data_jpw, false, date);
fileData+="\n";
fileData+= ("=============Actual PEW=============\n");
//console.log(data_pew);
fileData+= getData(data_pew, false, date);

console.log(fileData)
/*console.log("=============BUY=============\n");
console.log(JSON.stringify(newBuyData));
console.log("=============SELL=============\n");
console.log(JSON.stringify(newSellData));*/
fs.writeFile(outputFile, fileData, 'utf-8', function (err,data) {
  if (err) {
    return console.log(err);
  }
});

function sortFunction(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? -1 : 1;
    }
}

function getSum(array, divideByTwo){
var sum = 0;
  for(var i=0;i<array.length;i++){
      sum+= array[i][2]*array[i][3];
  }
  return divideByTwo == true? sum*2 : sum;
}