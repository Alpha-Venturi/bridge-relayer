# Bridge-Relayer #

## What is this repository for? ##

* relay ERC20 token transfers between two EVM chains using Hash-Time-Locked Bridge Contracts
* Version: 1.0.0

## How do I get set up? ##

### Dependencies ###

* Node.js v18.12.1 (run locally)
    * `npm install` to install libraries
* Docker version 20.10.17 (run in docker)

### Configuration ###

make a copy of `.env.example` and name it `.env`. Fill in the variables. Hints are given as comments in the example file.

### Deployment ###

1. configure the environment variables
1. `docker build -t relayer .`
1. `docker run --env-file ./.env relayer`


## Contributors ##

* Jonathan Rau (JadenX)