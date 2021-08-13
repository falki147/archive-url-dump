#!/usr/bin/env node
const { Command } = require("commander");
const process = require("process");
const ora = require("ora");
const path = require("path");
const fs = require("fs");
const axios = require("axios").default;
const axiosRetry = require("axios-retry");
const package = require("./package.json");

function getFileName(out, index) {
  return path.join(out, `url${index}.json`);
}

async function exists(file) {
  try {
    await fs.promises.access(file, fs.constants.F_OK);
  }
  catch (e) {
    return false;
  }

  return true;
}

function getKeyFromData(data) {
  if (data.length <= 2 || data[data.length - 2].length) {
    return null;
  }

  return data[data.length - 1][0];
}

async function getPreviousKey(out) {
  let i = 0;
  for (;;) {
    if (!await exists(getFileName(out, i))) {
      break;
    }

    ++i;
  }

  if (i == 0) {
    return [null, 0];
  }

  const data = JSON.parse(await fs.promises.readFile(getFileName(out, i - 1)));
  return [getKeyFromData(data), i];
}

function getTitle(index) {
  return "Downloading #" + index;
}

async function main(domain, out, limit) {
  const spinner = ora().start();

  try {
    spinner.text = "Checking previous files";

    let key, index;

    try {
      [key, index] = await getPreviousKey(out);
    }
    catch (e) {
      spinner.stop();
      console.error("Failed to check for previous files");
      console.log(e);
      return;
    }

    if (key !== null || index === 0) {
      const baseUrl = `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}` +
        `&matchType=prefix&output=json&limit=${encodeURIComponent(limit)}&showResumeKey=true`;
      
      axiosRetry(axios, {
        retries: 5,
        retryDelay: retries => {
          const time = 2000 + (retries - 1) * 20000;
          spinner.text = getTitle(index) + " failed, retrieing in " +
            Math.round(time / 100) / 10 + "s";
          return time;
        }
      });
      
      for (;;) {
        spinner.text = getTitle(index);

        const url = key !== null ? `${baseUrl}&resumeKey=${key}` : baseUrl;

        let data;
        try {
          data = (await axios.get(url)).data;
        }
        catch (e) {
          spinner.stop();
          console.error("Request failed:");
          console.log(url);
          console.log(e);
          return;
        }

        await fs.promises.writeFile(getFileName(out, index), JSON.stringify(data, null, 2));

        key = getKeyFromData(data);
        ++index;

        if (key === null) {
          break;
        }
      }
    }

    spinner.stop();
    console.log("Download done!");
  }
  catch (e) {
    spinner.stop();
    console.log(e);
    return;
  }
}

const program = new Command();

program
  .version(package.version, "-v, --version")
  .description("Download all URLs which match a given domain from Wayback Machine")
  .requiredOption("-d, --domain <domain>", "domain to match")
  .requiredOption("-o, --out <dir>", "output directory")
  .option("-l, --limit <limit>", "URLs fetched per request", 5000);

program.parse(process.argv);

const { domain, out, limit } = program.opts();

main(domain, out, limit);
