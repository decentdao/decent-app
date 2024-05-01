## Dockerized Workflow

The ultimate goal is to use Docker to create an environment that end to end testing can take place in. We needed a way for tests to be ran against a set of deployed contracts without worrying about any wallet integration. A local Hardhat node can be connected to via `ethers.providers.JsonRpcProvider` as a signer without having to confirm transactions through a wallet UI. Adding dockerized containers allows for these tests to run in a controlled environment and be ran using Github Actions during pull request creation and merging on Github.

### Blockchain

A pretty simply configured Hardhat node. Setup files are in the directory, `./docker/blockchain`:

- `.env.tests` holds environment variables for running Docker blockchain node.
  ```shell
  ALCHEMY_API_KEY="Your Alchemy Key"
  ```
- `Dockerfile` see comments in file. Creation script for blockchain Docker container
- `entrypoint.sh` executes the package.json script to start.
- `hardhat.config.js` sets the hardhat node to specific chain id and runs node forked from Sepolia and latest block
- `hardhat.package.json` with `hardhat` and `dotenv` libraries

### Webapp

Runs a dockerized version of `decent-interface`. Setup files are in the directory, `./docker/webapp`:

- `Dockerfile` see comments in file. Creation script for webapp Docker container
- `entrypoint.sh` executes the package.json script to start.

### Playwright

Coming soon (Playwright docker)

## Usage

### Setup

#### Installing Docker locally

You'll also need to have the Docker software installed on your computer and running. See [Docker](https://docker.com)

#### Alchemy API key

The blockchain container forks Sepolia, to be able to do this an Alchemy API key is needed.

You'll need to get a free Alchemy API key for a Sepolia project from https://www.alchemy.com/.

Once obtained, create a `.env.tests.local` file in `./docker/` directory. Add your Alchemy API key to an env variable `ALCHEMY_API_KEY` as shown in `./docker/.env.tests`. see https://hardhat.org/hardhat-network/docs/guides/forking-other-networks for more information on forking.

### Build

If files are changed, you should kill the instances and re-build and start again. `docker compose down` (if detached) or `crtl + c`

To build all containers:

```shell
$ docker compose build
```

To build a single container

```shell
$ docker compose build <container-name>
```

### Run

To run all services

```shell
$ docker compose up
```

To run all services in detached mode

```shell
$ docker compose up -d
```

To target a specific container to run

```shell
$ docker compose up <container-name>
```

You can also add the `--build` flag to the up command to build before running

```shell
$ docker compose up --build
```

### Stop

To stop all services

```shell
$ crtl-c
```

To stop detached services

```shell
$ docker compose stop
```

### Help

To see a list of commands

```shell
$ docker compose
# or
$ docker compose COMMAND --help
```
