
# Escalatie - de staatsschuld van België

https://youtu.be/LOAMO-tvSa8?feature=shared

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

- lasercutter

- aluminium 






## Benodigde software:

- visual studio code

- remote explorer

- javascript, Arduino IDE( arduino c++)

- Teamviewer

- illustrator


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
Om de knoppen te laten werken maken we gebruik van Arduino's. Hier schrijven we Arduino C++ code voor en maken we gebruik van Arduino IDE. Zie code in volgende link, uit repository.

https://github.com/Yassie123/Escalatie/blob/main/Arduino-Knop/cc-button/cc-button.ino
    
## Stap 6: schrijf script voor pi 1
Pi 1 is de hoofdpi, hiervoor schrijven we eerst het script. Dit is iets uitgebreider dan pi 2, daar deze moet communiceren met de webserver

*(note: maak een img folder aan met daarin de benodigde afbeeldingen)*
```
https://github.com/Yassie123/Escalatie/blob/main/pi-1/CC/server.js
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
https://github.com/Yassie123/Escalatie/blob/main/pi-2/CC/server.js
```
## Stap 8: schrijf code voor webserver
Ontwerp een design voor de teller er goed uit te laten zien. Met html, css en javascript

- maak een map aan, bv: web

HTML
```
https://github.com/Yassie123/Escalatie/blob/main/pi-1/CC/web/counter.html
```

CSS
```
https://github.com/Yassie123/Escalatie/blob/main/pi-1/CC/web/style.css
```


JAVASCRIPT:
```
https://github.com/Yassie123/Escalatie/blob/main/pi-1/CC/web/script.js
```
## Stap 9: maak de omkadering van de ledpanelen + kluisdozen

Gebruik volgende files om met de lasercutter te werken:

**Omkadering voor de ledpanelen in te hangen (9):**

https://github.com/Yassie123/Escalatie/blob/main/ledpanelen.ai.ps

**Kluisdozen:** beplak deze met aluminium voor een coole afwerking.

https://github.com/Yassie123/Escalatie/blob/main/kluis.ai.ps

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

https://github.com/Yassie123/Escalatie/blob/main/opstelling.JPG

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


