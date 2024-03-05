import fs from 'fs';
import readline from 'readline';
import { serialize } from 'v8';

const INPUT_PATH = './input.txt';
const OUTPUT_PATH = './output.txt';
const TMP_PATH = './tmp';
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

const splitInput = async () => {
  const rs = fs.createReadStream(INPUT_PATH);

  let block = [];
  let blockCount = 0;

  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
  for await (const line of rl) {
    block.push(line);
    const blockSize = serialize(block).byteLength;
    if (blockSize >= BLOCK_SIZE) {
      const ws = fs.createWriteStream(`${TMP_PATH}/${blockCount}`);
      ws.write(sortTextBlock(block).join(DELIMITER) + DELIMITER);
      ws.close();
      block = [];
      blockCount++;
    }
  }
  const ws = fs.createWriteStream(`${TMP_PATH}/${blockCount}`);
  ws.write(sortTextBlock(block).join(DELIMITER) + DELIMITER);
  ws.close();
};

const loadBlock = async (blockIndex: number) => {
  const rs = fs.createReadStream(`${TMP_PATH}/${blockIndex}`);
  return readline.createInterface({ input: rs, crlfDelay: Infinity });
};

const main = async () => {
  try {
    await fs.promises.stat(TMP_PATH);
  } catch (error) {
    await fs.promises.mkdir(TMP_PATH, { recursive: true });
  }

  await splitInput();

  const blockA = (await loadBlock(0))[Symbol.asyncIterator]();
  const blockB = (await loadBlock(1))[Symbol.asyncIterator]();

  const ws = fs.createWriteStream(OUTPUT_PATH);

  let lineA: string = (await blockA.next()).value;
  let lineB: string = (await blockB.next()).value;

  while (lineA && lineB) {
    console.log({ lineA, lineB });
    console.log(lineA.localeCompare(lineB));
    if (lineA.localeCompare(lineB) > 0) {
      ws.write(lineB + DELIMITER);
      lineB = (await blockB.next()).value;
    } else {
      ws.write(lineA + DELIMITER);
      lineA = (await blockA.next()).value;
    }
  }
  ws.write(lineA ?? lineB);
  ws.close();
};

main();
