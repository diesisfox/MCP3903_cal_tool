// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const $ = require('jquery');
const SerialPort = require('serialport');
const {clipboard} = require('electron')
var portsList, port;
// var pastReadings = [];

function scanPorts() {
	SerialPort.list((err,ports)=>{
		portsList = ports;
		$('#portDropdown').children().remove();
		if(portsList.length == 0){
			$("#portDropdown").append('<li id="noPorts"><a href="#">Nothing to show...</a></li>');
		}else{
			for (var i=0; i<portsList.length; i++){
				$("#portDropdown").append('<li class="dropdownSelect"><a href="#">'+portsList[i].comName.toString()+'</a></li>');
			}
		}
		var items = $("#portDropdown").children();
		for(var i=0; i<items.length; i++){
			let text = items[i].innerText;
			items[i].onclick = ()=>{
				$("#portBtn")[0].innerHTML = text+' <span class="caret"></span>';
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
			if((frame.id & 0xfff) == 0x203){
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
				$('#vad0')[0].innerText = (reading[0] * 2.33) /(8388608 * 3 * 1);;
				$('#vin0')[0].innerText = (reading[0]+20783)/33038;
				// $('#vin0')[0].innerText = vinViaInterpolaion(reading[0]);

				// pastReadings.shift();
				// pastReadings[1023] = reading[1];
				// let movingAverage = 0;
				// for(let i=0; i<pastReadings.length; i++){
				// 	movingAverage += pastReadings[1];
				// }
				// movingAverage /= pastReadings.length;

				$('#dec1')[0].innerText = reading[1];
				$('#rat1')[0].innerText = reading[1] * 100 / 0x800000;
				$('#vad1')[0].innerText = (reading[1] * 2.33) /(8388608 * 3 * 1);
				$('#vin1')[0].innerText = ch1Map(reading[1]);

				// copyData();
			}
		}
	}
}

function copyData(){
	clipboard.writeText($('#dec0')[0].innerText+'\t'+$('#dec1')[0].innerText);
}

window.onload = function(){
	scanPorts();
	$('#scanBtn')[0].onclick = ()=>{
		scanPorts;
		if(port.isOpen()){
			port.close();
		}
		$('#openBtn').addClass('btn-success');
		$('#closeBtn').removeClass('btn-danger');
		$('#portBtn')[0].innerHTML = 'Select Port <span class="caret"></span>';
	}
	$('#openBtn')[0].onclick = ()=>{
		openPort($("#portBtn")[0].innerText.slice(0,-1), (err)=>{
			console.log(err);
		});
	}
	$('#copyBtn')[0].onclick = copyData;
}

function ch0Map(raw){
	return (raw+20783)/33038;
}

function ch1Map(raw){
	return (raw+39388.8885017425)/1613637.11498258;
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
