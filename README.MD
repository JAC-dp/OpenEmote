# OpenEmote

An open-source version of Emote Manager written from scratch in Node.js.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Installation](#installation)
- [Docker](#docker)
- [Usage](#usage)
- [Contributing](#contributing)

## Description

OpenEmote is an open-source emote management system built with Node.js. It allows users to manage emotes seamlessly and efficiently.

## Features

- Simple and intuitive emote management.
- Docker support for easy deployment.
- Environment configuration for customizable setups.

## Installation

To get started with OpenEmote, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/JAC-dp/OpenEmote.git
    cd OpenEmote
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file from the example:
    ```sh
    cp example.env .env
    ```

4. Configure your environment variables in the `.env` file.

## Usage

To start the application, run:
```sh
node index.js
```

## Docker

For docker deployments
1. Clone the repository:
    ```sh
    git clone https://github.com/JAC-dp/OpenEmote.git
    cd OpenEmote
    ```

2. Create a `.env` file from the example:
    ```sh
    cp example.env .env
    ```

3. Build the docker image
    ```sh
    docker-compose up -d
    ```

## Contributing
All contributions are welcome!!!