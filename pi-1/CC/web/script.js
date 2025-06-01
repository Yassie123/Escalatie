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