# FindUp
This is the backend API service for the FindUp application, a platform designed to connect tech talent with startup founders in Indonesia. The backend handles user authentication, data management, and provides endpoints for core application functionalities.

## Table of Contents
- [Current Features](#current-features)
- [Technologies Used](#technologies-used)
- [Setup & Installation](#setup--installation)
- [API Endpoints](#api-endpoints)

## Current Features
- [x] Authentication
- [x] Several user actions
- [x] Posts
- [ ] CV detection
  - [x] Scoring
  - [ ] etc.
- [ ] etc.

## Technologies Used
- Node.js
- Express.js
- Sequelize.js
- JWT for authentication
- Google Cloud Platform (GCP):
  - Cloud Run
  - Cloud Storage
  - Cloud SQL
  - Cloud Run Function
  - Pub/Sub
  - Vertex AI
 
## Setup & Installation
1. Clone repository
```shell
git clone https://github.com/Timnas-Bangkit/API-CC
cd API-CC/ExpressProject
```
2. Install dependencies
```shell
npm install
```
3. Specify environtment variables
```shell
cp .env.example .env
vi .env
```
also [these](https://github.com/Timnas-Bangkit/API-CC/tree/master/ExpressProject/config) for additional configurations

4. Run the app
```shell
bin/www
```
grant execution permission first to the file.

## Api Endpoints
for more see our [documentations](https://documenter.getpostman.com/view/28068209/2sAYBPkZcs). 
