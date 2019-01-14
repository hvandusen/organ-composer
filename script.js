var options = {steps:["move notes","add/remove notes"]};
var colors = ["#28B922","#4C00A4","#EF0086","#F86519","#F9F72A","#8E723D","#80807E","#FFFFFF",]
var tempoPieChart;
var stepPieChart;
var programVersion = 1.0;
var todaysDate = Date().split(" ").slice(0,3).join(" ");
var scoreStatus = {
  notes: []
};

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

$(document).ready(function(){
  $(".config *").on("input",onConfigChange)
  initConfigFile();
  tempoPieChart = new DraggablePiechart({
  	canvas: document.getElementById('tempoPieChart'),
  	proportions: proportionsFromList(options.tempo),
    onchange: onTempoPieChartChange
  });
  if(false)
  stepPieChart = new DraggablePiechart({
  	canvas: document.getElementById('stepPieChart'),
  	proportions: proportionsFromList(options.steps),
    onchange: onStepPieChartChange
  });
  $(".go").click(generateScore);
});



function onTempoPieChartChange(piechart,p) {
  var percentages = piechart.getAllSliceSizePercentages().map(function(e){return Math.floor(e)});
  if(!percentages.equals(options.tempoProbabilities)){
    options.tempoProbabilities = percentages;
    generateScore()
  }
}

function onStepPieChartChange(piechart) {

  options.stepProbabilities = piechart.getAllSliceSizePercentages();
  generateScore()
}

function proportionsFromList(list){
  var outList = [];
  $.makeArray(list).map(function(e,i){
    outList.push( { proportion: Math.floor(100/list.length), format: { color: colors[i], label: e}} );
  })
  return outList
}

function initConfigFile(){
  $(".config  label").map(function(i,e){
    setOptionFromNumberInput(e);
  })
  $("ol").map(function(i,e){
    setOptionFromList(e);
  })
}

function setOptionFromNumberInput(e){

  options[$(e).attr("for")] = typeof $(e).find("input").attr("type") === "range" ? parseInt($(e).find("input").val()) : $(e).find("input").val();
  $(e).find("span").text(options[$(e).attr("for")]);
}

function setOptionFromList(e){
  var choices = [];
  $(e).find("li").map(function(i,e){
    choices.push($(e).text());
  })
  choices.filter(function(e,i){
    return e !== "";
  });
  options[$(e).parent().attr("for")] = choices;
}

function onConfigChange(e){
  switch (e.target.tagName) {
    case "OL":
      setOptionFromList(e.target)
      break;
    case "INPUT":
      setOptionFromNumberInput($(e.target).closest("label"));
      break;
  }
  console.log("config change ",options.tempo.length)
  var tempoPieChartHtml = $("#tempoPieChart").html();
  $("#tempoPieChart").remove();
  $(".probabilities").append('<canvas id="tempoPieChart" width="300" height="300"></canvas>')
  tempoPieChart = new DraggablePiechart({
  	canvas: document.getElementById('tempoPieChart'),
  	proportions: proportionsFromList(options.tempo),
    onchange: onTempoPieChartChange
  });
}

function pickWeighted(probs){
  var seed = Math.random()*100;
  var count = 0;
  var status = 0;
  while(seed>status){
    status+=probs[count];
    count++;
  }
  return count-1;
}

function num(range){
  return Math.floor(Math.random()*range);
}

function printOptions(options){
  var ignore = ["steps","title"]
  var out = "";
  Object.keys(options).map(function(e,i){
    if(ignore.indexOf(e)<0)
    out+= e + ": "+options[e]+ "<br>"
  })
  return out;
}

function generateScore(){
  $(".score-container").remove();
  $(".score > h1 ").text(options.title)
  $(".score-info").html("<h3>Generated on "+todaysDate+"</h3><h5>"+printOptions(options)+"</h5>");
  var score = $("<div class='score-container'></div>");
  var initialNotes = "";//$("<div>choose random note #1</div><div>choose random note #2</div>");
  console.log()
  for (var i = 1; i < parseInt(options["start-notes"])+1; i++) {
    initialNotes += "<div>choose random note #"+i+"</div>";
    scoreStatus.notes.push(0)
  }
  initialNotes = $(initialNotes);
  score.append(initialNotes)
  for (var i = 0; i < options.duration; i++) {
    var step = $("<div></div>");
    var tempoChoice = options.tempo[pickWeighted(options.tempoProbabilities)];
    var stepChoice = options.steps[0];
    switch (stepChoice) {
      case "move notes":
        step.text("move note #"+(1+num(2))+" "+["↑", "↓"][num(2)]+(1+num(options["max-movement"]))+" ")
        break;
      case "add/remove notes":
        //hen redo since status is an array now
        if (scoreStatus.notes.length===0){
          step.text("add finger");
          scoreStatus.notes.push(0);
        }
        else{
          var addOrRemoveChoice = [Math.floor(Math.random()*2)];
            step.text(["add","remove"][addOrRemoveChoice]+" finger");
            scoreStatus.notes += [1,-1][addOrRemoveChoice];
        }
        break;
    }
    step.text(step.text()+" and "+tempoChoice);
    score.append(step)
  }
  $(".score-steps").html(score)
}
