// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const $ = require('jquery');
const SerialPort = require('serialport');
const {clipboard} = require('electron')
var port, continuousMode = false, listenID = 0x201;
// var pastReadings = [];

// ##     ## ######## #### ##
// ##     ##    ##     ##  ##
// ##     ##    ##     ##  ##
// ##     ##    ##     ##  ##
// ##     ##    ##     ##  ##
// ##     ##    ##     ##  ##
//  #######     ##    #### ########

function copyData(){
	clipboard.writeText($('#dec0')[0].innerText+'\t'+$('#dec1')[0].innerText);
}

//  ######     ###    ##       ##       ########     ###     ######  ##    ##  ######
// ##    ##   ## ##   ##       ##       ##     ##   ## ##   ##    ## ##   ##  ##    ##
// ##        ##   ##  ##       ##       ##     ##  ##   ##  ##       ##  ##   ##
// ##       ##     ## ##       ##       ########  ##     ## ##       #####     ######
// ##       ######### ##       ##       ##     ## ######### ##       ##  ##         ##
// ##    ## ##     ## ##       ##       ##     ## ##     ## ##    ## ##   ##  ##    ##
//  ######  ##     ## ######## ######## ########  ##     ##  ######  ##    ##  ######

window.onload = function(){
	scanPorts();
	$('#scanBtn')[0].onclick = copyBtnCb;
	$('#openBtn')[0].onclick = ()=>{
		openPort($("#portBtn")[0].innerText.slice(0,-1), (err)=>{
			console.log(err);
		});
	}
	$('#copyBtn')[0].onclick = copyData;
	$('#continuousBtn')[0].onclick = contBtnCb;
	$('#idBtnGroup').children().click((e)=>{
		listenID = parseInt($(e.target).text(), 16);
		$('#idBtnGroup').children().addClass('btn-default');
		$(e.target).removeClass('btn-default');
	});

	$('#id201btn').click();
}

function contBtnCb(){
	if($('#continuousBtn').hasClass('btn-default')){
		continuousMode = true;
		$('#continuousBtn').removeClass('btn-default');
		$('#continuousBtn').addClass('btn-primary');
		$('#copyBtn').removeClass('btn-primary');
		$('#copyBtn')[0].onclick = null;
	}else{
		continuousMode = false;
		$('#continuousBtn').addClass('btn-default');
		$('#continuousBtn').removeClass('btn-primary');
		$('#copyBtn').addClass('btn-primary');
		$('#copyBtn')[0].onclick = copyBtnCb;
	}
}

$(document).click(function(event){
	event.target.blur();
});

function copyBtnCb(){
	scanPorts;
	if(port.isOpen()){
		port.close();
	}
	$('#openBtn').addClass('btn-success');
	$('#closeBtn').removeClass('btn-danger');
	$('#portBtn')[0].innerHTML = 'Select Port <span class="caret"></span>';
}

//  ######  ######## ########  ####    ###    ##
// ##    ## ##       ##     ##  ##    ## ##   ##
// ##       ##       ##     ##  ##   ##   ##  ##
//  ######  ######   ########   ##  ##     ## ##
//       ## ##       ##   ##    ##  ######### ##
// ##    ## ##       ##    ##   ##  ##     ## ##
//  ######  ######## ##     ## #### ##     ## ########

function scanPorts() {
	SerialPort.list((err,ports)=>{
		portsList = ports;
		$('#portDropdown').children().remove();
		if(ports.length == 0){
			$("#portDropdown").append('<li id="noPorts"><a href="#">Nothing to show...</a></li>');
		}else{
			for (var i=0; i<ports.length; i++){
				$("#portDropdown").append('<li class="dropdownSelect"><a href="#">'+ports[i].comName+'</a></li>');
				var tempPortName = ports[i].comName;
				$("#portDropdown").children()[i].onclick = ()=>{
					$("#portBtn")[0].innerHTML = tempPortName+' <span class="caret"></span>';
				};
			}
		}
	});
}

function openPort(comName){
	window.port = new SerialPort(comName, {
		parser: SerialPort.parsers.readline('\n'),
		autoOpen: false,
		baudRate: 230400,
		databits: 8,
		stopBits: 1,
		parity: 'none',
		lock: true
	});
	port.on('data', (data)=>{
		// console.log(data);
		parseData(data);
	});
	port.on('open', ()=>{
		$('#closeBtn').addClass('btn-danger');
		$('#openBtn').removeClass('btn-success');
		$('#closeBtn')[0].onclick = ()=>{
			if(port.isOpen()){
				port.close((err)=>{
					console.log(err);
				});
			}
		}
		$('#openBtn')[0].onclick = null;
	})
	port.on('close', ()=>{
		$('#openBtn').addClass('btn-success');
		$('#closeBtn').removeClass('btn-danger');
		$('#openBtn')[0].onclick = ()=>{
			openPort($("#portBtn")[0].innerText.slice(0,-1), (err)=>{
				console.log(err);
			});
		}
		$('#closeBtn')[0].onclick = null;
	})
	port.open();
}

//  ######   #######  ##    ## ##     ## ######## ########   ######  ####  #######  ##    ##
// ##    ## ##     ## ###   ## ##     ## ##       ##     ## ##    ##  ##  ##     ## ###   ##
// ##       ##     ## ####  ## ##     ## ##       ##     ## ##        ##  ##     ## ####  ##
// ##       ##     ## ## ## ## ##     ## ######   ########   ######   ##  ##     ## ## ## ##
// ##       ##     ## ##  ####  ##   ##  ##       ##   ##         ##  ##  ##     ## ##  ####
// ##    ## ##     ## ##   ###   ## ##   ##       ##    ##  ##    ##  ##  ##     ## ##   ###
//  ######   #######  ##    ##    ###    ######## ##     ##  ######  ####  #######  ##    ##

function parseData(data){
	var frame;
	try {
		frame = JSON.parse(data)
	} catch (e) {
		console.log(e);
	} finally {

	}
	if(frame){

		if(frame.type == 'frame'){
			frame.id = parseInt(frame.id, 16);
			if((frame.id & 0xfff) == listenID){
				$('#hex0')[0].innerText = frame.data[2] + frame.data[1] + frame.data[0];
				$('#hex1')[0].innerText = frame.data[6] + frame.data[5] + frame.data[4];
				for(let i=0; i<frame.data.length; i++){
					frame.data[i] = parseInt(frame.data[i], 16);
				}
				var reading = [(frame.data[3]<<24|frame.data[2]<<16|frame.data[1]<<8|frame.data[0]), (frame.data[7]<<24|frame.data[6]<<16|frame.data[5]<<8|frame.data[4])];
				for(let i=0; i<reading.length; i++){
					if(reading[i] > 0x7fffff){
						reading[i] -= 0x1000000;
					}
				}
				var channelNum = frame.id & 0xf;

				$('#dec0')[0].innerText = reading[0];
				$('#rat0')[0].innerText = reading[0] * 100 / 0x800000;
				$('#vad0')[0].innerText = (reading[0] * 2.33) /(8388608 * 3 * 1);

				$('#dec1')[0].innerText = reading[1];
				$('#rat1')[0].innerText = reading[1] * 100 / 0x800000;
				$('#vad1')[0].innerText = (reading[1] * 2.33) /(8388608 * 3 * 2);

				switch (listenID) {
					case 0x201:
						$('#vin0')[0].innerText = psb0ch0Map(reading[0]);
						$('#vin1')[0].innerText = psb1ch1Map(reading[1]);
						break;
					case 0x202:
					case 0x203:
						$('#vin0')[0].innerText = psb0ch4Map(reading[0]);
						$('#vin1')[0].innerText = psb0ch5Map(reading[1]);
						break;
					default:
						break;
				}

				if(continuousMode) copyData();
			}
		}
	}
}

function psb0ch0Map(raw){
	return (raw+20783)/33038;
}

function psb0ch1Map(raw){
	return (raw + 30217.2042253521) / 163576.265422321;
}

function psb0ch4Map(raw){
	return (raw+17051.8328322493)/33134.5112988709;
}

function psb0ch5Map(raw){
	return (raw-12693.6707317073)/324921.553523035;
}

function psb1ch1Map(raw){
	return (raw-69080.9705882353)/165597.927315084;
}

function vinViaInterpolaion(raw){
	let loIndex = binarySearchLow(raw, 0, ch0lut.length-1);
	let lowV = ch0lut[loIndex][0];
	let VRange = (ch0lut[loIndex+1][0]-ch0lut[loIndex][0]);
	let rawRange = ch0lut[loIndex+1][1]-ch0lut[loIndex][1];
	let deltaRaw = raw-ch0lut[loIndex][1];
	return lowV + (VRange * deltaRaw / rawRange);
}

function binarySearchLow(mohms, low, high){
	if(high-low == 1) return low;
	let middleIndex = Math.floor((low+high)/2);
	if(mohms <= ch0lut[middleIndex][1]){
		return binarySearchLow(mohms, low, middleIndex);
	}else{
		return binarySearchLow(mohms, middleIndex, high);
	}
}

var ch0lut = [
	[0.011,-19754],		[5,145393],			[10,310482],		[15,475283],
	[20,640279],		[25,805465],		[30.1,973998],		[35.22,1142652],
	[40.41,1314167],	[45.76,1490752],	[51.66,1685731],	[55.17,1801058],
	[60.25,1968857],	[65.33,2136178],	[70.4,2303742],		[75,2453834],
	[80,2621218],		[85.1,2788957],		[90.2,2959515],		[95.3,3129667],
	[100.5,3299866],	[105.7,3473919],	[111.3,3656618],	[115.2,3786654]
]
