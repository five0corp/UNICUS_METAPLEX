1. BUILD
git clone https://bitbucket.org/crsujith/metaplex.git
cd metaplex/js
yarn install
yarn bootstrap

//Copy SSL certificate to /metaplex/js
//IF the location of SSL certificate changes, please modify /metaplex/js/package.json and search for ".key" or ".cert"

2. RUN 
//STOP existing apache server
sudo systemctl stop httpd

//Use screen command to create a instance of terminal. Otherwise when SSH terminates, all the process will terminate
screen
//Use screen command to check if existing is running. If its running, attach the to existing screen.
screen -ls

//reattach to the screen. Screen Number will be displayed in screen -ls command
screen -r screennumber
//Use screen command to create a new instance of terminal.
cd metaplex/js

//Start the server
yarn start

3. SCREEN ATTACH & DETACH
//DETACH Screen to come out of the session and to keep the server running.
PRESS CNTRL A + D

//to reattach
screen -r scureennumber 

//In some cases, if you want to terminate the processes related to screen or node, use ps -al and kill commands
//Or simply restart the server and follow the RUN commands.
