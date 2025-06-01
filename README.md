
# Escalatie - de staatsschuld van België
APtrap presenteert: €scalatie

Een installatie om de huidige staatsschuld van België voor te stellen.

Stel je voor: je staat aan de voet van een trap, met een geldzak in je handen. 
Voor je staat een scherm dat meedogenloos aftelt, €1170, elke seconde, dieper in de schuld. 
De Belgische schuldenberg blijft maar groeien, ondanks al onze inspanningen. Maar vandaag krijg jij de kans om terug te vechten.
Terwijl je de zware geldzak naar de overkant draagt, flitsen zinnen voorbij op LED-schermen. Ze vertalen de kille realiteit van onze financiële situatie naar iets tastbaars. Elk scherm toont hoeveel een seconde schuld écht betekent: 200 PS5's, 400 sessies rijles, 16 jaar kothuur. Elke stap die je zet, voelt zwaarder, niet alleen fysiek, maar ook mentaal.
Als je eindelijk de overkant bereikt en de geldzak in de kluis deponeert, drukt je geldzak op een knop. Een kleine klik, maar met impact. Via een Arduino stuurt deze knop een signaal naar een Raspberry Pi die de grote teller aanstuurt. Voor een kort moment zie je de schuld dalen, jouw inspanning, zichtbaar voor iedereen.
Achter de schermen draait deze installatie op zelf geschreven code. Een technisch netwerk dat net zo complex is als de economische werkelijkheid die het weerspiegelt.

De vraag is: hoe lang kun jij het volhouden tegen de groeiende schuldenberg?
## Auteur

- [@Yasmine Stubbe](https://www.github.com/Yassie123)


## Benodigde hardware

- 2x Raspberry Pi (4B, Broadcom BCM2711 SoC,1.5 GHz 64/32-bit quad-core ARM Cortex-A72, , 2.4GHz and 5GHz LAN, Bluetooth 5, BLE Native Gigabit Ethernet 2 x USB 2.0 + 2 x USB3, 40-pin extended GPIO connector, USB-c power supply connector, Dual monitor support, micro-HDMI, 4K video)

- 2 MicroSDHC kaarten ( minimum 8GB+, the faster the better)

- 2x Arduino + 2x Drukknoppen:

- 1 8x LED-matrix displays (compatibel met PixelPusher): 

- Netgear GS108, 8 ethernet ports

- 3 ethernet netwerkkabels ( elks 5 meter, voor gemak)

- 2x monitor schermen (bv: Samsung TV 55” FULL HD LED)

- 2x Laptops






## Benodigde software:

- visual studio code

- remote explorer

- javascript, Arduino IDE( arduino c++)

- Teamviewer 


## Netwerk Configuratie

**IP-adressen**

- Pi 1 (Hoofdcontroller): 192.168.100.1
- Pi 2 (Secundaire): 192.168.100.3
- TCP Poort: 5005
- HTTP/WebServer Poort: 8080
## Stap 1: Raspberry Pi Basis Setup

**Benodigdheden:**
- USB-to-Ethernet adapter
- Ethernet-kabel (RJ45)


**Installatie stap 1:**

Download en installeer Raspberry Pi Imager op
https://www.raspberrypi.com/software/

**Installatie stap 2: voorbereiden van de SD-kaartt**

- Steek de MicroSD-kaart in je computer
- Open Raspberry Pi Imager
- Selecteer als model: RASPBERRY PI 4
- Selecteer als besturingssysteem: RASPBERRY PI OS (64-BIT) = BOOKWORM

- zorg ervoor de bij opslagapparaat je MicroSD-kaart is geselecteerd
- gebruik de geavanceerde instellingen via: aanpassen
    -**Hostnaam:** rpi-cc, **Gebruikersnaam:** pi, **Wachtwoord:** raspberry, **Wifi SSID:** (je eigen wifi), **Wifi wachtwoord:** ??, **Wifi land:** BE, **Regio:** Europe/Brussels, **SSH inschakelen:** wachtwoord authenticatie
- Instellingen toepassen + waarschuwing voor verwijderen gegevens aanvaarden



## Stap 2: Configuratie raspberry

Volg de stappen in volgende link om de raspberry Pi verder te configureren voor SSH instellingen enzovoort...

https://meeplemaker.github.io/idl4-cc-rpi-install/

## Stap 3: Installeer remote explorer
installeer Remote explorer in visual studio code om in de code van de pi's te kunnen via visual studio: https://marketplace.visualstudio.com/items?itemName=ms-vscode.remote-explorer

- ga in de 192.168.100.1 of 192.168.100.3 
- maak een folder aan

## Stap 4: PixelPusher Setup

Volg deze stappen en clone het directory van github in je folder:
https://github.com/hzeller/rpi-matrix-pixelpusher

-3.1 rpi-matrix-pixelpusher downloaden (beide Pi's) 

**cd ~ git clone https://github.com/adafruit/rpi-matrix-pixelpusher.git**

-3.2 maak een pp.sh script met daarin:

**#!/bin/bash**

**sudo ./pixel-push -i lo -u 65507 --led-rows=64 --led-cols=64 --led-parallel=1 --led-chain=9 --led-slowdown-gpio=4 --led-show-refresh --led-no-hardware-pulse**


(Note voor later: pas het aantal rijen of kolommen aan naargelang het aantal ledschermen dat je hebt
--> doe dit als het pp.sh script NIET draait)






## Stap 5: schrijf arduino script om de 0 en 1 door te geven naar de pi's
Om de knoppen te laten werken maken we gebruik van Arduino's. Hier schrijven we Arduino C++ code voor en maken we gebruik van Arduino IDE
https://github.com/Yassie123/Escalatie/blob/main/Arduino-Knop/cc-button/cc-button.ino

```
/*
  Arduino Button Serial Output (Newline) & LED Blink

  Reads a digital input on pin 4.
  Prints '1' (pressed) or '0' (not pressed) to the Serial Monitor on a NEW LINE
  ONLY when the button's state changes.
  Blinks the built-in LED when the button is pressed.
  Assumes a momentary push button is connected between pin 4 and GND.
  Uses the internal pull-up resistor.

  - Button state change from NOT pressed to PRESSED: Pin 4 goes LOW -> Serial sends '1'\n, LED starts blinking.
  - Button state change from PRESSED to NOT pressed: Pin 4 goes HIGH -> Serial sends '0'\n, LED stops blinking and turns OFF.
  - No change in button state: No serial output. LED continues its current behavior (blinking or off).
*/

// Define the pin the button is connected to
const int buttonPin = 4;
// Define the built-in LED pin (usually 13)
const int ledPin = LED_BUILTIN;

// Variable to store the stable, debounced button state
int buttonState = HIGH; // Initialize assuming not pressed (HIGH due to pull-up)
// Variable to store the last raw reading (for debounce)
int lastReading = HIGH;

// Debounce variables
unsigned long lastDebounceTime = 0; // Last time the input pin reading changed
unsigned long debounceDelay = 50;    // Debounce time in ms

// LED Blink variables
unsigned long lastLedToggleTime = 0; // Last time the LED was toggled
unsigned long blinkInterval = 200;   // Blink interval in ms (e.g., 200ms on, 200ms off)
int ledState = LOW;                  // Current state of the LED

void setup() {
  // Initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
  delay(100); // Allow serial to initialize


  // Initialize the button pin as an input with the internal pull-up resistor enabled:
  pinMode(buttonPin, INPUT_PULLUP);

  // Initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW); // Start with LED off

  // Read the initial state to set buttonState correctly
  // and send it once
  buttonState = digitalRead(buttonPin);
  lastReading = buttonState; // Initialize last reading
  if (buttonState == LOW) {
    Serial.println('1'); // '1' will be on the next line
  } else {
    Serial.println('0'); // '0' will be on the next line
  }
}

void loop() {
  // --- Button Reading and Debouncing ---
  int currentReading = digitalRead(buttonPin);

  // If the reading changed, reset the debounce timer
  if (currentReading != lastReading) {
    lastDebounceTime = millis();
  }

  // If the reading has been stable longer than the debounce delay
  if ((millis() - lastDebounceTime) > debounceDelay) {
    // If the stable reading is different from the current button state,
    // then the button state has effectively changed.
    if (currentReading != buttonState) {
      buttonState = currentReading; // Update the stable state

      // --- Serial Output on State Change ---
      // Send the new state via serial ONLY when it changes, each on a new line
      if (buttonState == LOW) {
        Serial.println('1'); // Button has just been pressed, send '1' then newline
      } else {
        Serial.println('0'); // Button has just been released, send '0' then newline
      }
    }
  }
  lastReading = currentReading; // Update last reading for next loop

  // --- LED Control (remains the same) ---
  if (buttonState == LOW) {
    // Button is PRESSED - Blink the LED
    unsigned long currentMillis = millis();
    if (currentMillis - lastLedToggleTime >= blinkInterval) {
      // Time to toggle the LED
      lastLedToggleTime = currentMillis; // Reset the timer
      // Toggle LED state
      if (ledState == LOW) {
        ledState = HIGH;
      } else {
        ledState = LOW;
      }
      // Update the actual LED
      digitalWrite(ledPin, ledState);
    }
  } else {
    // Button is NOT PRESSED - Turn LED off
    if (ledState == HIGH) { // Only write if it's currently on
       digitalWrite(ledPin, LOW);
       ledState = LOW; // Update the state variable
    }
  }

  // --- Loop Delay ---
  // Small delay to keep the loop responsive but not overwhelm the processor.
  delay(5);
}

```
    
## Stap 6: schrijf script voor pi 1
Pi 1 is de hoofdpi, hiervoor schrijven we eerst het script. Dit is iets uitgebreider dan pi 2, daar deze moet communiceren met de webserver

*(note: maak een img folder aan met daarin de benodigde afbeeldingen)*

```
const { SerialPort, ReadlineParser } = require('serialport');
const net = require('net');
const express = require('express');
const path = require('path');
const http = require('http'); // Added for making HTTP requests
const { WebSocketServer } = require('ws'); // Added for WebSocket server
const PixelPusher = require('node-pixel-pusher');
const nodeCanvas = require('canvas');

const PI1_IP = '192.168.100.1'; 
const PI2_IP = '192.168.100.3'; 
const TCP_PORT = 5005;

const service = new PixelPusher.Service();
const MAX_FPS = 30;
const WS_PORT = 3000;

let isLedOn = false; // Added state variable for Pi1's LED
let pi2Client = null; 
let reconnectInterval = 5000; 

let shouldRender = true; // Global flag to control rendering
let itemsQueue = []; // Queue for images and positions
let initialPositions = []; // Store initial positions for reset

const portPath = '/dev/serial/by-id/usb-1a86_USB_Serial-if00-port0'; 
const baudRate = 9600; 

const port = new SerialPort({
  path: portPath,
  baudRate: baudRate,
  autoOpen: false, 
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' })); 

// --- Express App Setup ---
const app = express();
const HTTP_PORT = 8080;

// --- Sequence Detection Logic ---
let currentSequenceStep = 0;
const requiredSequencePattern = ['B1_P', 'B2_P', 'B1_P', 'B2_P']; // B1_P: Pi1 Button Press, B2_P: Pi2 Button Press

function triggerWebAction() {
  const options = {
    hostname: PI1_IP, // Loopback to self
    port: HTTP_PORT,
    path: '/triggerWebAction?value=-10000',
    method: 'GET'
  };

  const req = http.request(options, res => {
    console.log(`Web action triggered: statusCode: ${res.statusCode}`);
    // Optional: Log response body
    // res.on('data', d => {
    //   process.stdout.write(d);
    // });
  });

  req.on('error', error => {
    console.error('Error triggering web action:', error);
  });
  req.end();
  console.log('Attempted to trigger web action with value -10000 for the sequence.');
}

function checkAndTriggerWebAction() {
  if (currentSequenceStep === requiredSequencePattern.length) {
    console.log(`SUCCESS: Sequence ${requiredSequencePattern.join(' -> ')} detected!`);
    triggerWebAction();
    currentSequenceStep = 0; // Reset for next sequence detection
    console.log('Sequence reset after successful trigger.');
  }
}
// --- End Sequence Detection Logic ---

// Store WebSocket clients
let wsClients = new Set();

// Serve static files from the 'web' directory
app.use(express.static(path.join(__dirname, 'web')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'counter.html'));
});

// Modify /triggerWebAction to also broadcast over WebSocket
app.get('/triggerWebAction', (req, res) => {
  const value = parseInt(req.query.value, 10); // Ensure value is a number
  console.log(`Web server endpoint /triggerWebAction called with value: ${value}`);

  if (value === -10000) {
    console.log("Sequence-triggered action for -10000 acknowledged by web server.");
    // Broadcast to all connected WebSocket clients
    broadcastToWebClients({ type: "sequenceTrigger", value: -100000 });
  }
  res.status(200).send(`Action triggered with value: ${value} processed.`);
});

const httpServer = app.listen(HTTP_PORT, () => {
  console.log(`HTTP server listening on http://${PI1_IP}:${HTTP_PORT}`);
  console.log(`Serving files from ${path.join(__dirname, 'web')}`);
});

// --- WebSocket Server Setup ---
const wss = new WebSocketServer({ server: httpServer });

console.log(`WebSocket server started and attached to HTTP server on port ${HTTP_PORT}`);

wss.on('connection', (ws) => {
  console.log('Web client connected via WebSocket');
  wsClients.add(ws);

  ws.on('message', (message) => {
    // For now, just log messages from client. Can be expanded later.
    console.log('Received WebSocket message from client:', message.toString());
  });

  ws.on('close', () => {
    console.log('Web client disconnected from WebSocket');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error with client:', error);
    wsClients.delete(ws); // Remove on error as well
  });
});

function broadcastToWebClients(data) {
  if (wsClients.size === 0) {
    console.log("No web clients connected to broadcast to.");
    return;
  }
  console.log(`Broadcasting to ${wsClients.size} web client(s):`, data);
  const messageString = JSON.stringify(data);
  wsClients.forEach(client => {
    if (client.readyState === client.OPEN) { // Check if client is OPEN (vs CONNECTING, CLOSING, CLOSED)
      client.send(messageString);
    } else {
      console.log("Client not open, removing from broadcast list.");
      // Optionally remove unresponsive clients here, though 'close' and 'error' should handle most cases.
      // wsClients.delete(client);
    }
  });
}
// --- End WebSocket Server Setup ---

function start_led() {
    shouldRender = true;

    console.log('Starting LED on pi1');
}

function stop_led() {
    shouldRender = false;
    broadcastToWebClients({ type: "sequenceTrigger", value: -100000 });

    console.log('Stopping LED on pi1');
}

function connectToPi2() {
  console.log(`Attempting to connect to Pi2 at ${PI2_IP}:${TCP_PORT}...`);
  pi2Client = net.createConnection({ host: PI2_IP, port: TCP_PORT }, () => {
    console.log('Connected to Pi2');
    
  });

  pi2Client.on('error', (err) => {
    console.error(`Pi2 client connection error: ${err.message}. Retrying in ${reconnectInterval / 1000}s...`);
    pi2Client = null; 
    setTimeout(connectToPi2, reconnectInterval); 
  });

  pi2Client.on('close', () => {
    console.log('Connection to Pi2 closed.');
    if (pi2Client) { 
        pi2Client = null;
        console.log(`Retrying connection to Pi2 in ${reconnectInterval / 1000}s...`);
        setTimeout(connectToPi2, reconnectInterval); 
    }
  });
}

const server = net.createServer((socket) => {
  const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`Pi2 connected from ${remoteAddress}`);

  socket.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`Received TCP data from Pi2 (${remoteAddress}): ${message}`);
    
    if (message === '0') { // Pi2 requests OFF (Button 2 pressed effect on Pi1's LED)
      if (isLedOn) {
        isLedOn = false;
        stop_led();
        console.log('LED on Pi1 turned OFF by Pi2 request.');
      }
      // --- Sequence Logic for B2_P ---
      console.log('Sequence: B2_P (from Pi2 via TCP \'0\') received.');
      if (requiredSequencePattern[currentSequenceStep] === 'B2_P') {
        currentSequenceStep++;
        console.log(`Sequence advanced. Current step: ${currentSequenceStep} (${requiredSequencePattern.slice(0, currentSequenceStep).join('->')})`);
      } else {
        if (currentSequenceStep > 0) console.log('Sequence broken by unexpected B2_P. Resetting.');
        currentSequenceStep = 0;
      }
      checkAndTriggerWebAction();
      // --- End Sequence Logic ---
    } else if (message === '1') { // Pi2 signals its LED is ON (Button 2 lifted effect on Pi1's LED)
      // Pi2 sending '1' will not turn Pi1's LED ON.
      console.log('Received TCP message \'1\' from Pi2 - no action taken on Pi1 LED state based on new rules.');
      // --- Sequence Logic for B2_L ---
      if (currentSequenceStep > 0) {
        console.log('Sequence: B2_L (from Pi2 via TCP \'1\') received. Resetting sequence.');
        currentSequenceStep = 0;
      }
      // --- End Sequence Logic ---
    } else {
      console.log(`Received unknown TCP data from Pi2: ${message}`);
    }
  });

  socket.on('close', () => {
    console.log(`Connection from Pi2 (${remoteAddress}) closed`);
  });

  socket.on('error', (err) => {
    console.error(`TCP Socket error with Pi2 (${remoteAddress}): ${err.message}`);
  });
});

server.listen(TCP_PORT, PI1_IP, () => {
  console.log(`TCP server for Pi1 listening on ${PI1_IP}:${TCP_PORT}`);
});

server.on('error', (err) => {
  console.error(`TCP Server error: ${err.message}`);
  
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${TCP_PORT} is already in use. Exiting.`);
    process.exit(1);
  }
});

port.open((err) => {
  if (err) {
    return console.error('Error opening port: ', err.message);
  }
  console.log(`Serial port ${portPath} opened at ${baudRate} baud.`);
});

parser.on('data', (data) => {
  const trimmedData = data.toString().trim();
  console.log('Serial data received:', trimmedData);

  let messageToSend = '';

  if (trimmedData === '0') { // Button 1 lifted
    isLedOn = true;
    start_led();
    messageToSend = '1'; // Pi1 LED is ON
    // --- Sequence Logic for B1_L ---
    if (currentSequenceStep > 0) {
      console.log('Sequence: B1_L (Serial \'0\') detected. Resetting sequence.');
      currentSequenceStep = 0;
    }
    // --- End Sequence Logic ---
  } else if (trimmedData === '1') { // Button 1 pressed
    isLedOn = false;
    stop_led();
    messageToSend = '0'; // Pi1 LED is OFF
    // --- Sequence Logic for B1_P ---
    console.log('Sequence: B1_P (Serial \'1\') detected.');
    if (requiredSequencePattern[currentSequenceStep] === 'B1_P') {
      currentSequenceStep++;
      console.log(`Sequence advanced. Current step: ${currentSequenceStep} (${requiredSequencePattern.slice(0, currentSequenceStep).join('->')})`);
    } else {
      console.log('Sequence broken or current B1_P is out of order.');
      if (requiredSequencePattern[0] === 'B1_P') {
        currentSequenceStep = 1;
        console.log(`Sequence reset and restarted with current B1_P. New step: ${currentSequenceStep}`);
      } else {
        currentSequenceStep = 0;
        console.log('Sequence fully reset.');
      }
    }
    checkAndTriggerWebAction();
    // --- End Sequence Logic ---
  } else {
    console.log('Received unknown serial data:', trimmedData);
  }

  if (pi2Client && pi2Client.writable) {
    console.log(`Sending '${messageToSend}' to Pi2 via TCP...`);
    pi2Client.write(messageToSend + '\n'); 
  } else {
    console.log('Cannot send data: Not connected to Pi2.');
    
  }
});

port.on('error', (err) => {
  console.error('Serial port error: ', err.message);
});

port.on('close', () => {
  console.log('Serial port closed.');
});


process.on('SIGINT', () => {
  console.log('Caught interrupt signal (Ctrl+C)');
  let serialClosed = false;
  let tcpClosed = false;
  let clientDisconnected = false;

  const checkExit = () => {
    if (serialClosed && tcpClosed && clientDisconnected) {
      console.log('All connections closed. Exiting.');
      process.exit(0);
    }
  };

  
  if (port.isOpen) {
    port.close(() => {
      console.log('Serial port closed on exit.');
      serialClosed = true;
      checkExit();
    });
  } else {
    serialClosed = true;
  }

  
  server.close(() => {
    console.log('TCP server closed on exit.');
    tcpClosed = true;
    checkExit();
  });

  
  if (pi2Client) {
    const tempClient = pi2Client; 
    pi2Client = null; 
    tempClient.end(() => {
        console.log('TCP client connection to Pi2 closed on exit.');
        clientDisconnected = true;
        checkExit();
    });
  } else {
    clientDisconnected = true;
  }

  
  setTimeout(() => {
    console.warn('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 5000);

  checkExit(); 

});

console.log('Raspberry Pi serial listener started. Waiting for data...');
connectToPi2(); 


const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('Enter 0 or 1 in the terminal to simulate button press for Pi1 and send over TCP:');

readline.on('line', (input) => {
  const trimmedInput = input.trim().toLowerCase(); // Standardize to lowercase
  console.log(`Simulating input: ${trimmedInput}`);

  let messageToSend = '';

  if (trimmedInput === '0') { // Simulates: Button 1 Lifted -> LED ON
    isLedOn = true;
    start_led();
    messageToSend = '1'; // Pi1 LED is ON
  } else if (trimmedInput === '1') { // Simulates: Button 1 Pressed -> LED OFF
    isLedOn = false;
    stop_led();
    messageToSend = '0'; // Pi1 LED is OFF
  } else {
    console.log('Invalid input for simulation. Please enter 0 or 1.');
    return;
  }

  if (pi2Client && pi2Client.writable) {
    console.log(`Sending simulated '${messageToSend}' to Pi2 via TCP...`);
    pi2Client.write(messageToSend + '\n'); 
  } else {
    console.log('Cannot send simulated data: Not connected to Pi2.');
  }
});



function createRenderer(device) {
  const width = device.deviceData.pixelsPerStrip;
  const height = device.deviceData.numberStrips;
  const canvas = nodeCanvas.createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  console.log(`Creating renderer ${width}x${height} at ${MAX_FPS}fps`);

 const items = [
    { imagePath: '/home/pi/CC/img/chat.png', text: '200x ChatGpt plus' },
    { imagePath: '/home/pi/CC/img/auto.png', text: '400x Rijlessen' },
      { imagePath: '/home/pi/CC/img/fles.png', text: '100 jaar alcoholvoorraad' },
          { imagePath: '/home/pi/CC/img/koffie.png', text: '33 jaar starbucks' },
      { imagePath: '/home/pi/CC/img/nike.png', text: '200x Nike outfit' },
          { imagePath: '/home/pi/CC/img/notion.png', text: '200 jaar notion abonnement' },
      { imagePath: '/home/pi/CC/img/redbull.png', text: '200 baden redbull' },
          { imagePath: '/home/pi/CC/img/duolingo.png', text: '1000 jaar Duolingo Super' },
      { imagePath: '/home/pi/CC/img/fastfood.png', text: '16 jaar McDonalds' },
          { imagePath: '/home/pi/CC/img/fitness.png', text: '200 jaar fitness' },
      { imagePath: '/home/pi/CC/img/gsm.png', text: '200x iphone 13' },
          { imagePath: '/home/pi/CC/img/headset.png', text: '200x Airpods Max ' },
      { imagePath: '/home/pi/CC/img/jbl.png', text: '200x JBL boombox 3' },
      { imagePath: '/home/pi/CC/img/kothuur.png', text: '16 jaar kothuur' },
          { imagePath: '/home/pi/CC/img/tomorrow.png', text: '200x Tomorrowland Tickets' },
      { imagePath: '/home/pi/CC/img/laptop.png', text: '200x HP laptop' },
          { imagePath: '/home/pi/CC/img/ps5.png', text: '200x ps5' },
      { imagePath: '/home/pi/CC/img/school.png', text: '100 jaar studiekost' },
          { imagePath: '/home/pi/CC/img/sneaker.png', text: '1000 paar Air jordans' },
      { imagePath: '/home/pi/CC/img/tanken.png', text: '16 jaar tanken' },
          { imagePath: '/home/pi/CC/img/step.png', text: '200x e-step' },
      { imagePath: '/home/pi/CC/img/trein.png', text: '200 jaar NMBS ' },
      { imagePath: '/home/pi/CC/img/wasmachine.png', text: '200x wasmachine' },
       { imagePath: '/home/pi/CC/img/watch.png', text: '200x applewatch' },
          { imagePath: '/home/pi/CC/img/xbox.png', text: '200x Xbox serie X' }
  ];

    Promise.all(items.map(item => nodeCanvas.loadImage(item.imagePath)))
      .then(images => {
        // Initialize positions dynamically
        const itemSpacing = 150; // Space between images
        itemsQueue = images.map((image, index) => ({
          image,
          text: items[index].text,
          x: width + index * itemSpacing, // Space out images horizontally
        }));
  
        initialPositions = itemsQueue.map(item => item.x);
  
        device.startRendering(() => {
          if (!shouldRender) {
            ctx.clearRect(0, 0, width, height);
            const blankImageData = ctx.getImageData(0, 0, width, height);
            device.setRGBABuffer(blankImageData.data);
            return;
          }
  
          // Clear canvas
          ctx.clearRect(0, 0, width, height);
  
          // Draw and update positions
          itemsQueue.forEach(item => {
            const iconSize = 60;
            const iconY = (height / 3) - (iconSize / 2);
  
            // Draw image/icon
            ctx.drawImage(item.image, item.x, iconY, iconSize, iconSize);
  
            // Draw text
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            const textWidth = ctx.measureText(item.text).width;
            const textX = item.x + (iconSize / 2) - (textWidth / 2);
            const textY = iconY + iconSize + 10;
            ctx.fillText(item.text, textX, textY);
  
            // Move left
            item.x -= 2;
  
            // Loop item to end if it goes out of view
            if (item.x < -iconSize) {
              item.x = Math.max(...itemsQueue.map(i => i.x)) + itemSpacing;
            }
          });
  
          // Send data to LEDs
          const imageData = ctx.getImageData(0, 0, width, height);
          device.setRGBABuffer(imageData.data);
        }, MAX_FPS);
      })
      .catch(err => {
        console.error('Failed to load images:', err);
      });
  }

// Discover PixelPusher devices
service.on('discover', createRenderer);
```



**TIP**: om de porthpath te identificeren, gebruik volgende code:
```
# Sluit Arduino aan via USB
lsusb
ls -la /dev/serial/by-id/

# Noteer de exacte device naam, bijvoorbeeld:
# Pi1: /dev/serial/by-id/usb-1a86_USB_Serial-if00-port0
# Pi2: /dev/serial/by-id/usb-FTDI_FT232R_USB_UART_A10L6QJY-if00-port0
```
## Stap 7: schrijf script voor pi 2


```
const { SerialPort, ReadlineParser } = require('serialport');
const net = require('net'); 
const PixelPusher = require('node-pixel-pusher');
const nodeCanvas = require('canvas');
const { registerFont } = require('canvas');
const path = require('path');

// Register your Google Font
registerFont(path.join(__dirname, 'fonts/Roboto-VariableFont_wdth,wght.ttf'), { family: 'Roboto' });

const service = new PixelPusher.Service();
const MAX_FPS = 30;
const WS_PORT = 3000;

let shouldRender = true; // Global flag to control rendering
let itemsQueue = []; // Queue for images and positions
let initialPositions = []; // Store initial positions for reset

const PI1_IP = '192.168.100.1'; 
const PI2_IP = '192.168.100.3'; 
const TCP_PORT = 5005;

let pi1Client = null; 
let reconnectInterval = 5000; 
let isLedOn_pi2 = false; 

const portPath = '/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_A10L6QJY-if00-port0'; 
const baudRate = 9600; 

const port = new SerialPort({
  path: portPath,
  baudRate: baudRate,
  autoOpen: false, 
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' })); 

function start_led() {
  shouldRender = true;
    console.log('Starting LED on pi2'); 
}

function stop_led() {
  shouldRender = false;
}

function connectToPi1() {
  console.log(`Attempting to connect to Pi1 at ${PI1_IP}:${TCP_PORT}...`);
  pi1Client = net.createConnection({ host: PI1_IP, port: TCP_PORT }, () => {
    console.log('Connected to Pi1');
  });

  pi1Client.on('error', (err) => {
    console.error(`Pi1 client connection error: ${err.message}. Retrying in ${reconnectInterval / 1000}s...`);
    pi1Client = null; 
    setTimeout(connectToPi1, reconnectInterval); 
  });

  pi1Client.on('close', () => {
    console.log('Connection to Pi1 closed.');
    if (pi1Client) { 
        pi1Client = null;
        console.log(`Retrying connection to Pi1 in ${reconnectInterval / 1000}s...`);
        setTimeout(connectToPi1, reconnectInterval); 
    }
  });
}

const server = net.createServer((socket) => {
  const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`Pi1 connected from ${remoteAddress}`);

  socket.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`Received TCP data from Pi1 (${remoteAddress}): ${message}`);
    
    if (message === '0') {
      if (isLedOn_pi2) {
        isLedOn_pi2 = false;
        stop_led();
        console.log('LED on Pi2 turned OFF by Pi1 request.');
      }
    } else if (message === '1') {
      console.log('Received TCP message \'1\' from Pi1 - no action taken on Pi2 LED state based on new rules.');
    } else {
      console.log(`Received unknown TCP data from Pi1: ${message}`);
    }
  });

  socket.on('close', () => {
    console.log(`Connection from Pi1 (${remoteAddress}) closed`);
  });

  socket.on('error', (err) => {
    console.error(`TCP Socket error with Pi1 (${remoteAddress}): ${err.message}`);
  });
});

server.listen(TCP_PORT, PI2_IP, () => {
  console.log(`TCP server for Pi2 listening on ${PI2_IP}:${TCP_PORT}`);
});

server.on('error', (err) => {
  console.error(`TCP Server error: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${TCP_PORT} is already in use. Exiting.`);
    process.exit(1);
  }
});

port.open((err) => {
  if (err) {
    return console.error('Error opening port: ', err.message);
  }
  console.log(`Serial port ${portPath} opened at ${baudRate} baud.`);
});

parser.on('data', (data) => {
  const trimmedData = data.toString().trim();
  console.log('Pi2 Serial data received:', trimmedData);

  let messageToSend = '';

  if (trimmedData === '0') {
    isLedOn_pi2 = true;
    start_led();
    messageToSend = '1';
  } else if (trimmedData === '1') {
    isLedOn_pi2 = false;
    stop_led();
    messageToSend = '0';
  } else {
    console.log('Received unknown serial data on Pi2:', trimmedData);
    return;
  }

  if (pi1Client && pi1Client.writable) {
    console.log(`Sending '${messageToSend}' (Pi2 state) to Pi1 via TCP...`);
    pi1Client.write(messageToSend + '\n');
  } else {
    console.log('Cannot send state to Pi1: Not connected.');
  }
});

port.on('error', (err) => {
  console.error('Serial port error: ', err.message);
});

port.on('close', () => {
  console.log('Serial port closed.');
});


process.on('SIGINT', () => {
  console.log('Caught interrupt signal (Ctrl+C)');
  let serialClosed = false;
  let tcpClosed = false;
  let clientDisconnected = false;


  const checkExit = () => {
    if (serialClosed && tcpClosed && clientDisconnected) {
      console.log('All connections closed. Exiting.');
      process.exit(0);
    }
  };

  
  if (port.isOpen) {
    port.close(() => {
      console.log('Serial port closed on exit.');
      serialClosed = true;
      checkExit();
    });
  } else {
    serialClosed = true;
  }

  
  server.close(() => {
    console.log('TCP server closed on exit.');
    tcpClosed = true;
    checkExit();
  });

  
  if (pi1Client) {
    const tempClient = pi1Client; 
    pi1Client = null; 
    tempClient.end(() => {
        console.log('TCP client connection to Pi1 closed on exit.');
        clientDisconnected = true;
        checkExit();
    });
  } else {
    clientDisconnected = true;
  }

  
  setTimeout(() => {
    console.warn('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 5000);

  checkExit(); 
});

console.log('Raspberry Pi 2 serial listener started. Waiting for data...'); 
connectToPi1(); 


const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('Enter 0 or 1 in the terminal to simulate button press for Pi2 and send over TCP:');

readline.on('line', (input) => {
  const trimmedInput = input.trim().toLowerCase();
  console.log(`Simulating Pi2 input: ${trimmedInput}`);

  let messageToSend = '';

  if (trimmedInput === '0') {
    isLedOn_pi2 = true;
    start_led();
    messageToSend = '1';
  } else if (trimmedInput === '1') {
    isLedOn_pi2 = false;
    stop_led();
    messageToSend = '0';
  } else {
    console.log('Invalid input for simulation. Please enter 0 or 1.');
    return;
  }

  if (pi1Client && pi1Client.writable) {
    console.log(`Sending simulated '${messageToSend}' (Pi2 state) to Pi1 via TCP...`);
    pi1Client.write(messageToSend + '\n');
  } else {
    console.log('Cannot send simulated state to Pi1: Not connected.');
  }
});

function createRenderer(device) {
  const width = device.deviceData.pixelsPerStrip;
  const height = device.deviceData.numberStrips;
  const canvas = nodeCanvas.createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  console.log(`Creating renderer ${width}x${height} at ${MAX_FPS}fps`);

  const items = [
    { imagePath: '/home/pi/CC/img/chat.png', text: '200x ChatGpt plus' },
    { imagePath: '/home/pi/CC/img/auto.png', text: '400x Rijlessen' },
      { imagePath: '/home/pi/CC/img/fles.png', text: '100 jaar alcoholvoorraad' },
          { imagePath: '/home/pi/CC/img/koffie.png', text: '33 jaar starbucks' },
      { imagePath: '/home/pi/CC/img/nike.png', text: '200x Nike outfit' },
          { imagePath: '/home/pi/CC/img/notion.png', text: '200 jaar notion abonnement' },
      { imagePath: '/home/pi/CC/img/redbull.png', text: '200 baden redbull' },
          { imagePath: '/home/pi/CC/img/duolingo.png', text: '1000 jaar Duolingo Super' },
      { imagePath: '/home/pi/CC/img/fastfood.png', text: '16 jaar McDonalds' },
          { imagePath: '/home/pi/CC/img/fitness.png', text: '200 jaar fitness' },
      { imagePath: '/home/pi/CC/img/gsm.png', text: '200x iphone 13' },
          { imagePath: '/home/pi/CC/img/headset.png', text: '200x Airpods Max ' },
      { imagePath: '/home/pi/CC/img/jbl.png', text: '200x JBL boombox 3' },
      { imagePath: '/home/pi/CC/img/kothuur.png', text: '16 jaar kothuur' },
          { imagePath: '/home/pi/CC/img/tomorrow.png', text: '200x Tomorrowland Tickets' },
      { imagePath: '/home/pi/CC/img/laptop.png', text: '200x HP laptop' },
          { imagePath: '/home/pi/CC/img/ps5.png', text: '200x ps5' },
      { imagePath: '/home/pi/CC/img/school.png', text: '100 jaar studiekost' },
          { imagePath: '/home/pi/CC/img/sneaker.png', text: '1000 paar Air jordans' },
      { imagePath: '/home/pi/CC/img/tanken.png', text: '16 jaar tanken' },
          { imagePath: '/home/pi/CC/img/step.png', text: '200x e-step' },
      { imagePath: '/home/pi/CC/img/trein.png', text: '200 jaar NMBS ' },
      { imagePath: '/home/pi/CC/img/wasmachine.png', text: '200x wasmachine' },
       { imagePath: '/home/pi/CC/img/watch.png', text: '200x applewatch' },
          { imagePath: '/home/pi/CC/img/xbox.png', text: '200x Xbox serie X' }
  ];

  // Load images
  Promise.all(items.map(item => nodeCanvas.loadImage(item.imagePath)))
    .then(images => {
      // Initialize positions dynamically
      const itemSpacing = 150; // Space between images
      itemsQueue = images.map((image, index) => ({
        image,
        text: items[index].text,
        x: width + index * itemSpacing, // Space out images horizontally
      }));

      initialPositions = itemsQueue.map(item => item.x);

      device.startRendering(() => {
        if (!shouldRender) {
          ctx.clearRect(0, 0, width, height);
          const blankImageData = ctx.getImageData(0, 0, width, height);
          device.setRGBABuffer(blankImageData.data);
          return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw and update positions
        itemsQueue.forEach(item => {
          const iconSize = 60;
          const iconY = (height / 3) - (iconSize / 2);

          // Draw image/icon
          ctx.drawImage(item.image, item.x, iconY, iconSize, iconSize);

          // Draw text
          ctx.fillStyle = 'white';
          ctx.font = '14px Arial';
          const textWidth = ctx.measureText(item.text).width;
          const textX = item.x + (iconSize / 2) - (textWidth / 2);
          const textY = iconY + iconSize + 10;
          ctx.fillText(item.text, textX, textY);

          // Move left
          item.x -= 2;

          // Loop item to end if it goes out of view
          if (item.x < -iconSize) {
            item.x = Math.max(...itemsQueue.map(i => i.x)) + itemSpacing;
          }
        });

        // Send data to LEDs
        const imageData = ctx.getImageData(0, 0, width, height);
        device.setRGBABuffer(imageData.data);
      }, MAX_FPS);
    })
    .catch(err => {
      console.error('Failed to load images:', err);
    });
}


// Discover PixelPusher devices
service.on('discover', createRenderer);
```
## Stap 8: schrijf code voor webserver
Ontwerp een design voor de teller er goed uit te laten zien. Met html, css en javascript

- maak een map aan, bv: web

HTML
```
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
    <script defer src="script.js"></script>
    <title>Document</title>
</head>
<body>
    <div class="counter-container">
        <div class="counter">
            <div id="counter" class="debt-value">€ 556.800.222.000</div>
        </div>
        <div id="flying-euros"></div>
        <div id="grafiek"></div>
    </div>
    <div class="raster1">
        <img src="raster2.png" alt="raster">
    </div>
    <div class="raster2">
        <img src="raster.png" alt="raster">
    </div>

    <div class="centje1">
        <img src="centje.png" alt="centje">
    </div>

    <div class="centje2">
        <img src="centje.png" alt="centje">
    </div>
    <div class="centje3">
        <img src="centje.png" alt="centje">
    </div>
    <div class="centje4">
        <img src="centje.png" alt="centje">
    </div>
    <div class="centje5">
        <img src="centje.png" alt="centje">
    </div>
    <div class="centje6">
        <img src="centje.png" alt="centje">
    </div>
    <div class="centje7">
        <img src="centje.png" alt="centje">
    </div>
    <div class="centje8">
        <img src="centje.png" alt="centje">
    </div>
</body>
</html>
```

CSS
```
/* style.css */

/* Algemene body stijl */
body {
    font-family: 'Arial', sans-serif;
    background-color: #000000;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    overflow: hidden;
}



/* Teller zelf */
.counter {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
    font-size: 4em;
    font-weight: bold;
    color: #d4f04d;
    transition: transform 0.2s ease;
}
@keyframes shake {
    0% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    50% { transform: translateX(10px); }
    75% { transform: translateX(-10px); }
    100% { transform: translateX(0); }
}

/* De tekst van de staatsschuld */
.debt-value {
    text-align: center;
    padding: 20px;
    position: relative;
}

/* Container voor de vliegende euro's */
#flying-euros {
    position: absolute;
    top: 300px;
    left: 100%;
    transform: translateX(-50%);
    width: 80%;
}
#grafiek {
    position: absolute;
    top: 400px;
    left: 100%;
    transform: translateX(-50%);
    width: 80%;
}
/* Animatie voor de vliegende euro's recht omhoog */
@keyframes flyUp {
    0% {
        transform: translateY(0px); /* Beginpositie */
        opacity: 1;
    }
    100% {
        transform: translateY(-60px); /* Vlieg recht omhoog */
        opacity: 0; /* Maak ze onzichtbaar */
    }
}
@keyframes appear {
    0% {
        transform: translateY(0px); /* Beginpositie */
        opacity: 1;
    }
    100% {
        transform: translateY(-10px); /* Vlieg recht omhoog */
        opacity: 0; /* Maak ze onzichtbaar */
    }
}
.grafiek{
    position: absolute;
    animation: appear 2s forwards; /* Duur van de animatie */
}
/* Vliegende euro's stijl */
.flying-euro {
    font-size: 3em;
    font-weight: 600;
    font-family: 'Arial', sans-serif;
    color: red;
    position: absolute;
    animation: flyUp 2s forwards; /* Duur van de animatie */
}




div.raster1{
    width: 100vh;
    right: -500px;
    position: absolute;
    z-index: -1;
    rotate: 90;
}
div.raster1 img{
    width: 100%;
}

div.raster2{
    width: 50vh;
    left: 0;
    position: absolute;
    z-index: -1;
    rotate: 180deg;
}
div.raster2 img{
    width: 100%;
}


div.centje1{
    position: absolute;
    width: 15%;
    left: 40px;
    top: 40px;
}

div.centje1 img, div.centje3 img, div.centje5 img, div.centje7 img {
    width: 100%;
    animation: draaienlinks 10s ease-in-out infinite;

}

div.centje2 img, div.centje4 img, div.centje6 img, div.centje8 img {
    width: 100%;
    animation: draaienrechts 10s ease-in-out infinite;

}
div.centje2{
    position: absolute;
    width: 20%;
    rotate: -10deg;
    left: 150px;
    top: 250px;
}

div.centje3{
    position: absolute;
    width: 15%;
    rotate: -90deg;
    left: 20px;
    bottom: 30px;
}

div.centje4{
    position: absolute;
    width: 20%;
    rotate: -30deg;
    right: 20px;
    top: 30px;
}

div.centje5{
    position: absolute;
    width: 10%;
    rotate: -80deg;
    right: 80px;
    top: 300px;
}
div.centje6{
    position: absolute;
    width: 15%;
    rotate: 0deg;
    right: 80px;
    bottom: 50px;
}
div.centje7{
    position: absolute;
    width: 20%;
    rotate: -100deg;
    right: 500px;
    top: 50px;
}

div.centje8{
    position: absolute;
    width: 10%;
    rotate: 0deg;
    right: 500px;
    bottom: 20px;
}


@keyframes draaienlinks {
    0%{
        rotate: 0deg;
        margin-bottom: 0px;
        margin-left: 0px;
    }
    50%{
        rotate: -20deg;
        margin-bottom: 10px;
        margin-left: 50px;
    }
    100%{
        rotate: 0deg;
        margin-bottom: 0px;
        margin-left: 0px;
    }
}


@keyframes draaienrechts {
    0%{
        rotate: 0deg;
        margin-top: 0px;
        margin-left: 0px;
    }
    50%{
        rotate: 20deg;
        margin-top: 10px;
        margin-left: 50px;
    }
    100%{
        rotate: 0deg;
        margin-top: 0px;
        margin-left: 0px;
    }
}
```


JAVASCRIPT:
```
let stateDebt = 556800222000;
const increment = 1170;   
let animationInProgress = false;

// --- WebSocket Client Setup ---
// Determine host dynamically for flexibility (e.g. localhost or actual IP)
const wsHost = window.location.hostname || 'localhost';
// Assuming HTTP port is 80 for Pi1, WebSocket will share this.
// For local dev, if node server runs on a different port, adjust this or use window.location.port
const wsPort = window.location.port || 8080; // Use current page port or default to 80

// Use wss:// if on https, ws:// if on http
const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const socket = new WebSocket(`${wsProtocol}://${wsHost}:${wsPort}`);

socket.onopen = () => {
    console.log('WebSocket connection established with server.');
};

socket.onmessage = (event) => {
    console.log('WebSocket message received:', event.data);
    try {
        const message = JSON.parse(event.data);
        if (message.type === 'sequenceTrigger' && typeof message.value === 'number') {
            console.log(`Sequence trigger received from server. Subtracting: ${message.value}`);
            // Note: message.value is -10000, so we pass it directly.
            // If subtractAmount expects a positive number to subtract, use Math.abs(message.value)
            subtractAmount(message.value); 
        } else {
            console.log('Received unknown WebSocket message format or type.');
        }
    } catch (error) {
        console.error('Error parsing WebSocket message or handling event:', error);
    }
};

socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
};

socket.onclose = () => {
    console.log('WebSocket connection closed. Attempting to reconnect in 5 seconds...');
    // Optional: implement reconnection logic
    // setTimeout(() => {
    //   // new WebSocket(...)
    // }, 5000);
};
// --- End WebSocket Client Setup ---

document.addEventListener("DOMContentLoaded", function() {
    const formattedDebt = formatNumber(stateDebt);
    document.getElementById("counter").textContent = `€ ${formattedDebt}`;
});

function updateStateDebt() {
    stateDebt += increment; 
    const formattedDebt = formatNumber(stateDebt); 
    document.getElementById("counter").textContent = `€ ${formattedDebt}`;

    localStorage.setItem('stateDebt', stateDebt);
}

function formatNumber(number) {
    return number.toLocaleString('nl-BE'); 
}

// Modified to accept an amount to subtract
function subtractAmount(amountToSubtract) {
    if (animationInProgress) return;
    animationInProgress = true;

    stateDebt += amountToSubtract; // amountToSubtract is expected to be negative, e.g., -10000
    const formattedDebt = formatNumber(stateDebt);
    const counterElement = document.getElementById("counter");
    
    counterElement.textContent = `€ ${formattedDebt}`;
    localStorage.setItem('stateDebt', stateDebt);

    counterElement.style.animation = "shake 0.5s";

    const flyingEuro = document.createElement("div");
    // Display the absolute value for the flying text, e.g., "- €10.000"
    flyingEuro.textContent = `- €${formatNumber(Math.abs(amountToSubtract))}`;
    flyingEuro.classList.add("flying-euro");  
    
    const flyingEurosContainer = document.getElementById("flying-euros");
    flyingEurosContainer.appendChild(flyingEuro);

    // Make coins fall down
    const coins = document.querySelectorAll(".centje1, .centje2, .centje3, .centje4, .centje5, .centje6, .centje7, .centje8");
    
    coins.forEach(coin => {
        // Store original position and style
        coin.dataset.originalTop = coin.style.top || getComputedStyle(coin).top;
        coin.dataset.originalLeft = coin.style.left || getComputedStyle(coin).left;
        coin.dataset.originalBottom = coin.style.bottom || getComputedStyle(coin).bottom;
        coin.dataset.originalRight = coin.style.right || getComputedStyle(coin).right;
        coin.dataset.originalRotate = coin.style.rotate || getComputedStyle(coin).rotate;
        
        // Immediately stop any current animations or transitions
        coin.style.animation = "none";
        
        // Force immediate application of position to current position
        void coin.offsetWidth;
        
        // Fix the horizontal position explicitly before falling
        const currentLeft = parseFloat(getComputedStyle(coin).left);
        coin.style.left = `${currentLeft}px`;
        
        // Make coins fall straight down with no horizontal movement
        coin.style.transition = "margin-top 1s ease-in, opacity 1s ease-in";
        
        // Clear any transforms or other properties that might affect movement
        coin.style.transform = "none";
        coin.style.marginLeft = "0";
        coin.style.marginTop = `${window.innerHeight + 800}px`;
        coin.style.opacity = "0.8";
    });
    
    const flyingGraph = document.createElement("img");
    flyingGraph.src = "grafiek.svg";
    flyingGraph.alt = "Grafiek";
    flyingGraph.classList.add("grafiek");

    // Add the graph to the graph container
    const flyingGraphContainer = document.getElementById("grafiek");
    flyingGraphContainer.appendChild(flyingGraph);
    
    // After animation completes
    setTimeout(() => {
        // Remove flying euro text
        flyingEuro.remove();
        
        // Reset counter shake animation
        counterElement.style.animation = "";
        
        // Reset coins to original positions with opacity 0
        coins.forEach(coin => {
            coin.style.transition = "none";
            coin.style.marginTop = `${window.innerHeight + 1000}px`;
            coin.style.opacity = "0";
            
            // Force reflow to make sure the transition removal takes effect
            void coin.offsetWidth;
        });
        
        // Fade coins back in at their original positions
        setTimeout(() => {
            coins.forEach(coin => {
                // Restore original positioning
                if (coin.dataset.originalTop) coin.style.top = coin.dataset.originalTop;
                if (coin.dataset.originalLeft) coin.style.left = coin.dataset.originalLeft;
                if (coin.dataset.originalBottom) coin.style.bottom = coin.dataset.originalBottom;
                if (coin.dataset.originalRight) coin.style.right = coin.dataset.originalRight;
                if (coin.dataset.originalRotate) coin.style.rotate = coin.dataset.originalRotate;
                
                // Reset animations
                coin.style.animation = "";
                
                // Clear any transforms or margins that might have been applied
                coin.style.transform = "none";
                coin.style.marginLeft = "0";
                
                // Transition back to original state
                coin.style.transition = "opacity 0.5s ease-in";
                coin.style.marginTop = "0";
                coin.style.opacity = "1";
            });
            
            // Animation complete, allow new animations
            animationInProgress = false;
        }, 100);
    }, 1500);
}

setInterval(updateStateDebt, 1000);

// setInterval(subtractAmount, 5000); // Removed: Subtraction is now triggered by WebSocket message
```

## Code folder overzicht
**Pi 1: 192.168.100.1**

```
CC
  ├ web (folder)
  | ├ assets
  | └ counter.html
    └ script.js
    └ style.css
  ├ rpi-matrix-pixelpusher (folder)
  ├ server.js
  └ img (folder)
  ├ package.json
  ├ package-lock.json
```
**Pi 2: 192.168.100.3**

```
CC
  ├ fonts (folder)
  ├ rpi-matrix-pixelpusher (folder)
  ├ server.js
  └ img (folder)
  ├ package.json
  ├ package-lock.json
```
**Arduino**

```
cc-button
  ├ cc-button.ino
```

## Setup

Pi 1:
- arduino aangesloten met stroom kabeltjes naar de GND (ground) en D4
- Usb kabel vanuit pi verbonden met de arduino
- Netwerk kabel vanuit pi naar Netgear (ingeplugd in stopcontact)
- Power kabel in usb-c van Pi 1

Pi 2:
- arduino aangesloten met stroom kabeltjes naar de GND (ground) en D4
- Usb kabel vanuit pi verbonden met de arduino
- Netwerk kabel vanuit pi naar Netgear (ingeplugd in stopcontact)
- Power kabel in usb-c van Pi 1


Computer 1:
- Netwerk kabel van computer naar Netgear
- HDMI kabel van scherm naar computer inpluggen
- Webserver runnen op poort 8080 (192.168.100.1:8080), voor live teller
- Teamviewer geïnstalleerd

Computer 2:
- HDMI kabel van scherm naar computer inpluggen
- Met Teamviewer het scherm mirroren

Schermen:
- Scherm in stopcontact voor stroom

Buttons:
- in kluisdoos
- Knop 1: verbonden met 2 stroomkabeltjes naar pi1 (vanuit GND en D4 op de pinnen van de knop)
- Knop 2: verbonden met 2 stroomkabeltjes naar pi2 (vanuit GND en D4 op de pinnen van de knop)


## Start het project

Ga naar de folder "rpi-matrix-pixelpusher" en gebruik volgend commando in de terminal (BELANGRIJK!!!: laat deze terminal runnen):

```bash
  bash pp.sh
```

Ga vervolgens naar de folder van je server.js file en run het script via dit commando, in een andere terminal:
```bash
  node server.js
```

Doe dit voor beide pi's


## Tips

- Als je pi niet reageert kan je testen of je nog netwerkconnectiviteit hebt met volgende code:

```
# Van Pi1 naar Pi2:
ping 192.168.100.3
```
```
# Van Pi2 naar Pi1:
ping 192.168.100.1
```


