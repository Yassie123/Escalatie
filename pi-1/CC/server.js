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