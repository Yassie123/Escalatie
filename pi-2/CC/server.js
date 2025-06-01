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