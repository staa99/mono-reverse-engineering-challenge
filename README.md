# Mono Reverse Engineering Challenge
This repository contains the Node JS API code for my solution to the Mono reverse engineering challenge. The APIs expose endpoints over the GT Bank internet banking portal and the APIs used by the Ecobank mobile app.

## Installation Guide

Clone this repository and `cd` into it on your terminal.

### Docker
Run the following commands, remember to replace <your-tag> and <your-port> with the tag and port you want to use respectively.
```
docker build -t <your-tag>
docker run -d -p <your-port>:8080 <your-tag>
```

### Local
Ensure you have Node `v12` or newer installed. The solution is tested only on `v12` and `v14`.
You can confirm by running `node -v`.

Run `npm install` to install the dependencies.

Run `npm run start` to start the application. You can then access it on http://localhost:<your port>.


Thanks for checking it out.
