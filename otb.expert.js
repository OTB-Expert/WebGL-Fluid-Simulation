/*
MIT License

Copyright (c) 2020 Florin Cumpanasu - OTB Expert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';

let editorTextarea = null;
let editorInfo = null;

let plot =
{
    id: 0,
    x: 0,
    y: 0
}

let plots = [];

function say(m) {
    var msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    msg.voice = voices[10];
    msg.voiceURI = "native";
    msg.volume = 1;
    msg.rate = 1;
    msg.pitch = 0.8;
    msg.text = m;
    msg.lang = 'en-US';
    speechSynthesis.speak(msg);
  }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomInt(max, min = 0) {
    return min + Math.floor(Math.random() * Math.floor(max));
}

// Get the integer value if the given text is the representation of a integer <= the fiven max if any
function intOrZero(text, max)
{             
    let value = parseInt(text, 10);
    if(NaN !== value && (!max || value <= max))
    {
        return value;
    }
    else{
        return 0;
    }
}

var lastQuestion = null;
var score = 0;
var waitingForAnswer = false;

function evaluateAsk(){
    let operators = ['+', '-','+', '-'];
    lastQuestion = getRandomInt(10) + ' ' + operators[getRandomInt(operators.length -1)] + ' ' + getRandomInt(10);
    waitingForAnswer = true;
    editorInfo.html("" + lastQuestion + ' = ?');
    say(lastQuestion.replace('-', 'minus'));
    return 0;
}

async function responde(line){
    let response = intOrZero(line);
    let expected = eval(lastQuestion);
    var correct = response == expected;
    
    editorInfo.html(lastQuestion + ' = ' + response + '<br>' + (correct ? 'correct answer' : 'wrong answer<br>expected ' + expected));
    if(correct)
    {
        score++;
        for(let i=0; i< 5; i++)
        {
            splatStack.push(1);
        }
    }
    say(
        (correct ? 'Correct!' : 'Wrong!') + lastQuestion.replace('-', 'minus') + (correct ? ' is ': ' is not ') + response + '. ' +
        (correct ? ' Your score is ' + score : lastQuestion.replace('-', 'minus') + ' is ' + expected)
    );
    if(score >= 3){
        say('Well done! You won this game!');
        for(let i =0; i<10; i++){
            await sleep(500);            
            for(let i=0; i< 5; i++)
            {
                splatStack.push(1);
            }
        }
    }
}

function evaluateRandom(code){
    let plotsRequested = getRandomInt(intOrZero(code));
    for(let i=0; i< plotsRequested; i++)
    {
        splatStack.push(1);
    }
    editorInfo.html("Random " + plotsRequested );
    say(plotsRequested + ' random stars where generated!');
    return plotsRequested;
}

function evaluateConditional(code){
    let regEx = /([^=])(=)([^=])/gi
    let jsCode = code.replace(regEx, '$1==$3'); // make js equalities work by replacing 1=1 with 1==1 
    var isTrue = eval(jsCode);
    if(isTrue){
        splatStack.push(1);
    }
    editorInfo.html("Was " + (isTrue ? 'true': 'false') );
    say('Expression was ' + (isTrue ? 'true': 'not true') + '!');
    return 1;
}

function evaluateLine(line, speed = 1){
    let complexity = 0;
        let type = line.split(' ')[0];  
        let body = null;      
        if(line.indexOf(' ') > 0){
            body = line.substring(line.indexOf(' ') + 1);
        }
        switch(type.toLowerCase()){
            case 'ask':
                complexity = evaluateAsk();
                break;
            case 'random':
                complexity = evaluateRandom(body);
                break;
            case 'if':
                complexity = evaluateConditional(body);
                break;
            default:
                tryNumbers(line, speed);
                break;
        }
}

function tryNumbers(line, speed = 1){
    let complexity = 0;
        let plotsRequested = parseInt(line, 10);
        if (NaN !== plotsRequested && plotsRequested < 50)
        {
            for(let i=0; i< plotsRequested; i++)
            {
                splatStack.push(1);
            }
        }
        complexity = plotsRequested;
    return complexity;
}

async function execute(code, runAll = false){
    let lines = code.split('\n');
    if(waitingForAnswer)
    {
        await responde(lines[lines.length-1]);
        waitingForAnswer = false;
        return;
    }

    let forceRun = lines[lines.length-1].trim().toLowerCase().indexOf('run') == 0;
    let speed = 1;
    if(forceRun)
    {
       let line = lines[lines.length-1];
       if(line.indexOf(' ') > -1)
       {
           let body = line.substring(line.indexOf(' ') + 1);           
           let plotsSpeed = parseInt(body, 10);
           if(NaN !== plotsSpeed && plotsSpeed <= 50)
           {
                speed = plotsSpeed;
           }
       }
    }
    runAll = runAll || forceRun;

    let complexity = 1;
    if(runAll){
        for(let i=0; i<lines.length; i++){
            complexity = evaluateLine(lines[i], speed);            
            await sleep(complexity * 500 * speed);
        }//);
    }
    else{
        // Evaluate just last line
        evaluateLine(lines[lines.length-1], speed); // Don't wait!
    }


/*

1
3
5
1
1
1
1
20
run 30

*/
    /*
    let plotsRequested = getRandomInt(5);
    for(let i=0; i< plotsRequested; i++)
    {
        plots.push({
            id: plots.length + 1,
            x: getRandomInt(10),
            y: getRandomInt(10)
        });
    }*/
    // evaluateConditional("1==1");
}

function printInfo(line) {
    let lastCommand = line.split(' ')[0].toLowerCase();
    let info = `
        Commands: <br>
        if <br>
        random`;
    switch(lastCommand)
    {
        case 'if':
            info = `
            IF <br>
            Conditional execution <br>
            if 1=1`;
            say('If. Conditionl execution. If expression is true you get a star!');
            break;
        case 'random':
            info = `
            RANDOM <br>
            With a maximum <br>
            random 5`;
            say('Random. You will get a random number of stars!');
            break;
        default:            
            say('You can use the following commands: if! random!');
            break;
    }
    editorInfo.html(info);
}

function startListening(elementId) {
    // your page initialization code here
    // the DOM will be available here
    editorTextarea = $('textarea');
    editorInfo = $("span:contains('Code Editor')");
    
    editorInfo.html(`
    Code Editor <br>
    Type ? for help
    `);
    editorTextarea.keypress(function(e){
        if(e.key === '?'){
            let allCode = editorTextarea.val().split('\n');
            printInfo(allCode[allCode.length-1]);
        }
        if(e.keyCode === 13){
            // e.preventDefault();
            execute(editorTextarea.val());
        }
      });
}