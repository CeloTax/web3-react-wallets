import * as React from "react";
import { UnsupportedChainIdError, useWeb3React } from "@web3-react/core";
import { URI_AVAILABLE } from "@web3-react/walletconnect-connector";
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from "@web3-react/injected-connector";
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from "@web3-react/walletconnect-connector";
import { formatEther } from "@ethersproject/units";
import { injected, network, walletconnect } from "../lib/connectors";
import Spinner from "./Spinner";

const connectorsByName = {
  Injected: injected,
  Network: network,
  WalletConnect: walletconnect,
};

function getErrorMessage(error) {
  if (error instanceof NoEthereumProviderError) {
    return "No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.";
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network.";
  } else if (
    error instanceof UserRejectedRequestErrorInjected ||
    error instanceof UserRejectedRequestErrorWalletConnect
  ) {
    return "Please authorize this website to access your Ethereum account.";
  } else {
    console.error(error);
    return "An unknown error occurred. Check the console for more details.";
  }
}

function MainContainer() {
  const context = useWeb3React();
  const {
    connector,
    library,
    chainId,
    account,
    activate,
    deactivate,
    active,
    error,
  } = context;

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState();
  React.useEffect(() => {
    console.log("running");
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);


  // set up block listener
  const [blockNumber, setBlockNumber] = React.useState();
  React.useEffect(() => {
    console.log("running");
    if (library) {
      let stale = false;

      console.log("fetching block number!!");
      library
        .getBlockNumber()
        .then((blockNumber) => {
          if (!stale) {
            setBlockNumber(blockNumber);
          }
        })
        .catch(() => {
          if (!stale) {
            setBlockNumber(null);
          }
        });

      const updateBlockNumber = (blockNumber) => {
        setBlockNumber(blockNumber);
      };
      library.on("block", updateBlockNumber);

      return () => {
        library.removeListener("block", updateBlockNumber);
        stale = true;
        setBlockNumber(undefined);
      };
    }
  }, [library, chainId]);

  // fetch eth balance of the connected account
  const [ethBalance, setEthBalance] = React.useState();
  React.useEffect(() => {
    console.log("running");
    if (library && account) {
      let stale = false;

      library
        .getBalance(account)
        .then((balance) => {
          if (!stale) {
            setEthBalance(balance);
          }
        })
        .catch(() => {
          if (!stale) {
            setEthBalance(null);
          }
        });

      return () => {
        stale = true;
        setEthBalance(undefined);
      };
    }
  }, [library, account, chainId]);

  // log the walletconnect URI
  React.useEffect(() => {
    console.log("running");
    const logURI = (uri) => {
      console.log("WalletConnect URI", uri);
    };
    walletconnect.on(URI_AVAILABLE, logURI);

    return () => {
      walletconnect.off(URI_AVAILABLE, logURI);
    };
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1 style={{ margin: "0", textAlign: "right" }}>
        {active ? "🟢" : error ? "🔴" : "🟠"}
      </h1>
      <h3
        style={{
          display: "grid",
          gridGap: "1rem",
          gridTemplateColumns: "1fr min-content 1fr",
          maxWidth: "20rem",
          lineHeight: "2rem",
          margin: "auto",
        }}
      >
        <span>Chain Id</span>
        <span role="img" aria-label="chain">
          ⛓
        </span>
        <span>{chainId === undefined ? "..." : chainId}</span>

        <span>Block Number</span>
        <span role="img" aria-label="numbers">
          🔢
        </span>
        <span>
          {blockNumber === undefined
            ? "..."
            : blockNumber === null
            ? "Error"
            : blockNumber.toLocaleString()}
        </span>

        <span>Account</span>
        <span role="img" aria-label="robot">
          🤖
        </span>
        <span>
          {account === undefined
            ? "..."
            : account === null
            ? "None"
            : `${account.substring(0, 6)}...${account.substring(
                account.length - 4
              )}`}
        </span>

        <span>Balance</span>
        <span role="img" aria-label="gold">
          💰
        </span>
        <span>
          {ethBalance === undefined
            ? "..."
            : ethBalance === null
            ? "Error"
            : `Ξ${parseFloat(formatEther(ethBalance)).toPrecision(4)}`}
        </span>
      </h3>
      <hr style={{ margin: "2rem" }} />
      <div
        style={{
          display: "grid",
          gridGap: "1rem",
          gridTemplateColumns: "1fr 1fr",
          maxWidth: "20rem",
          margin: "auto",
        }}
      >
        {Object.keys(connectorsByName).map((name) => {
          const currentConnector = connectorsByName[name];
          const activating = currentConnector === activatingConnector;
          const connected = currentConnector === connector;
          const disabled = !!activatingConnector || connected || !!error;

          return (
            <button
              style={{
                height: "3rem",
                borderRadius: "1rem",
                borderColor: activating
                  ? "orange"
                  : connected
                  ? "green"
                  : "unset",
                cursor: disabled ? "unset" : "pointer",
                position: "relative",
              }}
              disabled={disabled}
              key={name}
              onClick={() => {
                setActivatingConnector(currentConnector);
                activate(connectorsByName[name]);
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  color: "black",
                  margin: "0 0 0 1rem",
                }}
              >
                {activating && (
                  <Spinner
                    color={"black"}
                    style={{ height: "25%", marginLeft: "-1rem" }}
                  />
                )}
                {connected && (
                  <span role="img" aria-label="check">
                    ✅
                  </span>
                )}
              </div>
              {name}
            </button>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {(active || error) && (
          <button
            style={{
              height: "3rem",
              marginTop: "2rem",
              borderRadius: "1rem",
              borderColor: "red",
              cursor: "pointer",
            }}
            onClick={() => {
              deactivate();
            }}
          >
            Deactivate
          </button>
        )}

        {!!error && (
          <h4 style={{ marginTop: "1rem", marginBottom: "0" }}>
            {getErrorMessage(error)}
          </h4>
        )}
      </div>

      <hr style={{ margin: "2rem" }} />

      <div
        style={{
          display: "grid",
          gridGap: "1rem",
          gridTemplateColumns: "fit-content",
          maxWidth: "20rem",
          margin: "auto",
        }}
      >
        {!!(library && account) && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              library
                .getSigner(account)
                .signMessage("👋")
                .then((signature) => {
                  window.alert(`Success!\n\n${signature}`);
                })
                .catch((error) => {
                  window.alert(
                    "Failure!" +
                      (error && error.message ? `\n\n${error.message}` : "")
                  );
                });
            }}
          >
            Sign Message
          </button>
        )}
        {!!(connector === network && chainId) && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              connector.changeChainId(chainId === 1 ? 4 : 1);
            }}
          >
            Switch Networks
          </button>
        )}
        {connector === walletconnect && (
          <button
            style={{
              height: "3rem",
              borderRadius: "1rem",
              cursor: "pointer",
            }}
            onClick={() => {
              connector.close();
            }}
          >
            Kill WalletConnect Session
          </button>
        )}
      </div>
    </div>
  );
}

export default MainContainer;