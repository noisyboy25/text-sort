import fs from 'fs';
import readline from 'readline';
import { serialize } from 'v8';

const INPUT_PATH = './input.txt';
const OUTPUT_PATH = './output.txt';
const BLOCK_SIZE = 100;
const DELIMITER = '\n';

let _maxmemoryconsumption = 0;

process.nextTick(() => {
  let memusage = process.memoryUsage();
  if (memusage.rss > _maxmemoryconsumption) {
    _maxmemoryconsumption = memusage.rss;
  }
});

process.on('exit', () => {
  console.log(`max memory consumption: ${_maxmemoryconsumption / 1024 / 1024}`);
});

const sortTextBlock = (input: string[]) =>
  [...input].sort((a, b) => a.localeCompare(b));

const main = async () => {
  const rs = fs.createReadStream(INPUT_PATH);
  const ws = fs.createWriteStream(OUTPUT_PATH);

  let block = [];

  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
  for await (const line of rl) {
    block.push(line);
    const blockSize = serialize(block).byteLength;
    if (blockSize >= BLOCK_SIZE) {
      ws.write(sortTextBlock(block).join(DELIMITER) + DELIMITER);
      block = [];
    }
  }
  ws.write(sortTextBlock(block).join(DELIMITER));
};

main();
