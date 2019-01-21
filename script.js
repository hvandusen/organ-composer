var options = {steps:["move notes","add/remove notes"]};
var colors = ["#28B922","#4C00A4","#EF0086","#F86519","#F9F72A","#8E723D","#80807E","#FFFFFF",]
var tempoPieChart,stepPieChart,movementPieChart;
var stepPieChart;
var programVersion = 1.0;
var todaysDate = Date().split(" ").slice(0,3).join(" ");
var alphabet = 'ABCEFGHIJKLMNOPQRSTUVWXYZ';
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

Object.defineProperty(Array.prototype, "equals", {enumerable: false});

$(document).ready(function(){
  $(".config *").on("input",onConfigChange)
  initConfigFile();
  console.log(options)
  tempoPieChart = new DraggablePiechart({
  	canvas: document.getElementById('tempoPieChart'),
  	proportions: options.tempoProbabilities || proportionsFromList(options.tempo),
    onchange: onTempoPieChartChange
  });
  movementPieChart = new DraggablePiechart({
  	canvas: document.getElementById('movementPieChart'),
  	proportions: options.movementProbabilities || proportionsFromList(options.movement),
    onchange: onMovementPieChartChange
  });

  $(".go").click(generateTextScore);

  $(".print").click(function(){
    window.print();
  })
});

function onTempoPieChartChange(piechart,p){
  var percentages = piechart.getAllSliceSizePercentages().map(function(e){return Math.floor(e)});
  if(!percentages.equals(options.tempoProbabilities)){
    options.tempoProbabilities = percentages;
    generateTextScore()
    sessionStorage.options = JSON.stringify(options)
  }
}

function onMovementPieChartChange(piechart){
  var percentages = piechart.getAllSliceSizePercentages().map(function(e){return Math.floor(e)});
  if(!percentages.equals(options.movementProbabilities)){
    options.movementProbabilities = percentages;
    generateTextScore()
    sessionStorage.options = JSON.stringify(options)
  }
}

function proportionsFromList(list){
  var outList = [];
  $.makeArray(list).map(function(e,i){
    outList.push( { proportion: Math.floor(100/list.length), format: { color: colors[i], label: e}} );
  })
  return outList
}

function initConfigFile(){
  if(sessionStorage.hasOwnProperty("options")){
    options = Object.create(JSON.parse(sessionStorage.options));
    console.log("we gt one boys",options)
  }
  else {
    $(".config  label").map(function(i,e){
      setOptionFromNumberInput(e);
    })
    $("ol").map(function(i,e){
      setOptionFromList(e);
    })
  }
  sessionStorage.options = JSON.stringify(options)
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
  console.log("configChanged")
  switch (e.target.tagName) {
    case "OL":
      setOptionFromList(e.target);
      $("#tempoPieChart").remove();
      $("#movementPieChart").remove();
      $(".probabilities .tempo").append('<canvas id="tempoPieChart" width="300" height="300"></canvas>')
      $(".probabilities .movement").append('<canvas id="movementPieChart" width="300" height="300"></canvas>')
      tempoPieChart = new DraggablePiechart({
      	canvas: document.getElementById('tempoPieChart'),
      	proportions: proportionsFromList(options.tempo),
        onchange: onTempoPieChartChange
      });
      movementPieChart = new DraggablePiechart({
      	canvas: document.getElementById('movementPieChart'),
      	proportions: proportionsFromList(options.movement),
        onchange: onMovementPieChartChange
      });
      break;
    case "INPUT":
      setOptionFromNumberInput($(e.target).closest("label"));
      break;
  }
  generateTextScore();
  sessionStorage.options = JSON.stringify(options)
}

function pickWeighted(probs){
  if(!probs)
    return 0
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

function generateTextScore(){
  var counter = 1;
  scoreStatus.notes = [];
  $(".score-container").remove();
  $(".score > h1 ").text(options.title)
  $(".score-info").html("<h6>Generated on "+todaysDate+".<br>"+printOptions(options)+"</h6>");
  var score = $("<div class='score-container'></div>");
  var initialNotes = "";//$("<div>choose random note #1</div><div>choose random note #2</div>");
  for(var i = 1; i < parseInt(options["starting-notes"])+1; i++) {
    initialNotes += "<div>"+counter+") begin melody "+alphabet.charAt(i-1)+" at random note</div>";
    scoreStatus.notes.push(0)
    counter++;
  }
  var temp = counter;
  initialNotes = $(initialNotes);
  score.append(initialNotes)
  for (var i = 0; i < options.duration-temp+1; i++) {
    var step = $("<div class='score-step'></div>");
    var weightedTempoPick = pickWeighted(options.tempoProbabilities);
    var tempoChoice = weightedTempoPick;
    // console.log(options.tempo,weightedTempoPick,options.tempoProbabilities  )
    var movementChoice = options.movement[pickWeighted(options.movementProbabilities)%options.movement.length];
    var stepChoice = "move notes";
    switch (stepChoice) {
      case "move notes":
        step.html(counter+") move <span class='step-mel'>melody "+alphabet.charAt(num(scoreStatus.notes.length))+"</span><span>"+["↑", "↓"][num(2)]+"a "+movementChoice+"</span>")
        break;
      case "add/remove melodies":
        //hen redo since status is an array now
        if (scoreStatus.notes.length===0){
          step.html("add finger");
          scoreStatus.notes.push(0);
        }
        else{
          var addOrRemoveChoice = [Math.floor(Math.random()*2)];
            step.html(["add","remove"][addOrRemoveChoice]+" finger");
            scoreStatus.notes += [1,-1][addOrRemoveChoice];
        }
        break;
    }
    step.html(step.html()+" and <span>"+options.tempo[tempoChoice%options.tempo.length]+"</span>");
    score.append(step);
    counter++;
  }

  $(".score-steps").html(score)
}
