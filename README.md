# Sample_BramblJS_Application
NOTE: This repository is provided *AS IS* and is meant to demonstration purposes only. Best efforts are made to keep it up-to-date and to expand test coverage but we encourage any external users to file issues or pull requests it bugs are encountered.

## Description
A sample BramblJS application that uses all of the APIs which can be used for documentation, tutorials, training and onboarding. 

## Project Setup
### Local Installation
* To start local development, first clone this repository and install the local dependencies
```
git clone git@github.com:Topl/Sample_BramblJS_Application.git
cd Sample_BramblJS_Application
npm install
```

### Git Crypt
* This repo uses `git-crypt` for the encryption of secret information. Please be sure to have `git-crypt` available to access encrypted information. YOu must have your GPG public key added to the repo in order to be a collaborator on this project. More information can be found here https://github.com/AGWA/git-crypt. Once you have been added, you can decrypt the environment files by typing the following: 
```
git-crypt unlock
```

### Environment Files
* In order to properly run the application, you must have a .env file in the project root. 

### MongoDB
* In order to run this API, you must be connecting to a MongoDB Instance. You can either use the local database name specified in the connection string or specify your own in the local environment file.  

### NodeJS Version (NVM)
* This application was developed using a specific NodeJS version. In order to develop locally, ensure that the correct node version is running using NVM. There is a .nvmrc file in the project root. With NVM installed, type the following: 
```
nvm use
```

### Launch
* Once everything is installed, launch the application using `npm run start:dev`

### Docker Containerization
This is done by building a Docker image with the Dockerfile included. First, make sure that your working directory for your terminal is the docker directory within the resources folder. Then run the following commands
`docker build . -t topl/sample_brambljs_service`

### Docker Compose
In order to build a multi-container application, also providing the linking between containers, is through the [Docker Compose](https://docs.docker.com/compose/overview/).

Run the following command to get up and running quickly, with no hassle from the docker/compose directory
`docker-compose up`

### Bifrost Compatibility
- The Sample BramblJS application has been tested on Bifrost 1.3.x+
