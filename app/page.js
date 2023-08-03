"use client";
import React, { useState } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import { utcToZonedTime } from "date-fns-tz";
import "react-datepicker/dist/react-datepicker.css";
import "tailwindcss/tailwind.css";
import { ethers } from "ethers";

export default function Home() {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeZone, setSelectedTimeZone] = useState(localTimeZone);
  const [block, setBlock] = useState(null);
  const [isEstimate, setIsEstimate] = useState(false);
  const [searchedBlock, setSearchedBlock] = useState("");
  const [blockTimestamp, setBlockTimestamp] = useState("");
  const [searchedBlockNumber, setSearchedBlockNumber] = useState("");

  const timeZoneMappings = {
    "Local Timezone": localTimeZone,
    GMT: "Etc/GMT",
    PST: "America/Los_Angeles", // Pacific Standard Time
    EST: "America/New_York", // Eastern Standard Time
    // add more mappings as needed
  };

  const getBlockTimestamp = async () => {
    const ALCHEMY_KEY = process.env.ALCHEMY_KEY;

    try {
      const provider = new ethers.AlchemyProvider("mainnet", ALCHEMY_KEY);
      const block = await provider.getBlock(Number(searchedBlock));
      const date = new Date(block.timestamp * 1000);
      setBlockTimestamp(date.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getBlockNumber = async () => {
    const targetDate = utcToZonedTime(selectedDate, selectedTimeZone);
    const timestamp = Math.floor(targetDate.getTime() / 1000);
    const url = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=YourApiKeyToken`;

    if (timestamp > Math.floor(Date.now() / 1000)) {
      const estimatedBlockNumber = await estimateFutureBlockNumber();
      setIsEstimate(true);
      setBlock(estimatedBlockNumber);
      return;
    }

    setIsEstimate(false);

    try {
      const res = await axios.get(url);
      if (res.data.status === "1") {
        setBlock(res.data.result);
      } else {
        throw new Error(res.data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const estimateFutureBlockNumber = async () => {
    const currentBlockNumberUrl =
      "https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=YourApiKeyToken";
    const currentBlockNumberResponse = await axios.get(currentBlockNumberUrl);
    const currentBlockNumber = parseInt(
      currentBlockNumberResponse.data.result,
      16
    ); // the response is in hex, so we convert it to decimal

    const currentTimestamp = Math.floor(Date.now() / 1000); // current timestamp in seconds
    const futureTimestamp = Math.floor(selectedDate.getTime() / 1000); // selected future timestamp in seconds

    const secondsDifference = futureTimestamp - currentTimestamp;

    const estimatedBlocks = Math.round(secondsDifference / 15); // Ethereum targets a block every ~15 seconds

    const estimatedFutureBlockNumber = currentBlockNumber + estimatedBlocks;

    return estimatedFutureBlockNumber;
  };

  return (
    <div className="flex flex-col items-center pt-4 bg-gray-100 min-h-screen p-4">
      <h1 className="text-3xl mb-6">Ethereum Block Finder</h1>
      <p className="text-center mb-6 text-lg">
        Select a date, time, and timezone to find the corresponding Ethereum
        block number.
      </p>
      <div className="flex items-center space-x-4 mb-6">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          showTimeSelect
          dateFormat="Pp"
          className="p-2 border rounded-md border-gray-300"
        />
        <select
          value={selectedTimeZone}
          onChange={(e) => setSelectedTimeZone(e.target.value)}
          className="p-2 border rounded-md border-gray-300"
        >
          {Object.keys(timeZoneMappings).map((tz) => (
            <option key={tz} value={timeZoneMappings[tz]}>
              {tz}
            </option>
          ))}
        </select>
        <button
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-200 ease-in-out"
          onClick={getBlockNumber}
        >
          Get Block
        </button>
      </div>
      {block && (
        <div className="mt-4">
          <h2 className="text-lg mb-2">Block Number:</h2>
          <p className="text-blue-500 text-2xl">{block}</p>
          {isEstimate && (
            <p className="text-sm text-gray-500">
              This is an estimated block number for a future timestamp.
            </p>
          )}
        </div>
      )}
      <div className="mt-8">
        <h2 className="text-2xl mb-6">Find Timestamp of Block</h2>
        <p className="text-center mb-6 text-lg">
          Enter the block number to find its timestamp.
        </p>
        <div className="flex items-center space-x-4 mb-6">
          <input
            type="number"
            min="0"
            value={searchedBlock}
            onChange={(e) => setSearchedBlock(e.target.value)}
            className="p-2 border rounded-md border-gray-300"
          />
          <button
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-200 ease-in-out"
            onClick={getBlockTimestamp}
          >
            Get Timestamp
          </button>
        </div>
        {blockTimestamp && (
          <div className="mt-4">
            <h2 className="text-lg mb-2">Timestamp:</h2>
            <p className="text-blue-500 text-2xl">{blockTimestamp}</p>
          </div>
        )}
      </div>
    </div>
  );
}
