import * as React from "react";
import {
  Web3ReactProvider,
} from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import MainContainer from "../components/MainContainer";

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 8000;
  return library;
}

function Home () {

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <MainContainer />
    </Web3ReactProvider>
  )
}

export default Home