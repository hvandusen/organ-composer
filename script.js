var options = {steps:["move fingers","add/remove fingers"]};
var colors = ["#28B922","#4C00A4","#EF0086","#F86519","#F9F72A","#8E723D","#80807E","#FFFFFF",]
var tempoPieChart;
var stepPieChart;

$(document).ready(function(){
  $(".config *").on("input",onConfigChange)
  initConfigFile();
  tempoPieChart = new DraggablePiechart({
  	canvas: document.getElementById('tempoPieChart'),
  	proportions: proportionsFromList(options.tempo),
    onchange: onTempoPieChartChange
  });
  stepPieChart = new DraggablePiechart({
  	canvas: document.getElementById('stepPieChart'),
  	proportions: proportionsFromList(options.steps),
    onchange: onStepPieChartChange
  });
  $(".go").click(generateScore);
});

function onTempoPieChartChange(piechart) {
  options.tempoProbabilities = piechart.getAllSliceSizePercentages();
}

function onStepPieChartChange(piechart) {
  options.stepProbabilities = piechart.getAllSliceSizePercentages();
}

function proportionsFromList(list){
  var outList = [];
  $.makeArray(list).map(function(e,i){
    outList.push( { proportion: 100/list.length, format: { color: colors[i], label: e}} );
  })
  return outList
}

function initConfigFile(){
  $(".config  label").map(function(i,e){
    setOptionFromInput(e);
  })
  $("ol").map(function(i,e){
    setOptionFromList(e);
  })
}

function setOptionFromInput(e){
  options[$(e).attr("for")] = parseInt($(e).find("input").val());
  $(e).find("span").text(options[$(e).attr("for")]);
}

function setOptionFromList(e){
  var choices = $(e).find("li").map(function(i,e){
    return $(e).text();
  }).filter(function(i,e){
    return e !== "";
  });
  options[$(e).parent().attr("for")] = choices
}

function onConfigChange(e){
  switch (e.target.tagName) {
    case "OL":
      setOptionFromList(e.target)
      break;
    case "INPUT":
      setOptionFromInput($(e.target).closest("label"));
      break;
  }
  console.log("config change ",options.tempo.length)
  $("#tempo").remove();
  $(".probabilities").append('<canvas id="tempo" width="500" height="500"></canvas>')
  tempoPieChart = new DraggablePiechart({
  	canvas: document.getElementById('tempo'),
  	proportions: proportionsFromList(options.tempo),
    onchange: onTempoPieChartChange
  });
}

function pickWeighted(probs){
  var seed = Math.random()*100;
  var count = 0;
  var status = 0;
  while(seed>status){
    status+=probs[++count];
  }
  return count-1;
}

function generateScore(){
  console.log(options)
  var score = $("<div class='score-container'></div>");
  for (var i = 0; i < options.duration; i++) {
    var step = $("<span></span>");
    var stepChoice = pickWeighted(options.stepProbabilities)
    console.log(stepChoice)
  }
  $(".score").html(score)
}
