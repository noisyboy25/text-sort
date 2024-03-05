import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { serialize } from 'v8';

const INPUT_FILE = './input.txt';
const OUTPUT_FILE = './output.txt';
const TMP_DIR = './tmp';
const BLOCK_SIZE = 100;
const DELIMITER = '\n';

const sortTextBlock = (input: string[]) =>
  [...input].sort((a, b) => a.localeCompare(b));

const splitInput = async () => {
  const rs = fs.createReadStream(INPUT_FILE);

  let block = [];
  let blockCount = 0;

  const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
  for await (const line of rl) {
    block.push(line);
    const blockSize = serialize(block).byteLength;
    if (blockSize >= BLOCK_SIZE) {
      const ws = fs.createWriteStream(path.resolve(TMP_DIR, `${blockCount}`));
      ws.write(sortTextBlock(block).join(DELIMITER) + DELIMITER);
      ws.close();
      block = [];
      blockCount++;
    }
  }
  const ws = fs.createWriteStream(path.resolve(TMP_DIR, `${blockCount}`));
  ws.write(sortTextBlock(block).join(DELIMITER));
  ws.close();
};

const loadBlock = async (blockName: string) => {
  const rs = fs.createReadStream(path.resolve(TMP_DIR, blockName));
  return readline.createInterface({ input: rs, crlfDelay: Infinity });
};

const getAsyncIterator = (block: readline.Interface) =>
  block[Symbol.asyncIterator]();

const getNextValue = async (block: AsyncIterableIterator<string>) => {
  return ((await block.next()).value || '') as string;
};

const mergeBlocks = async () => {
  let dir = await fs.promises.readdir(TMP_DIR);

  while (dir.length > 1) {
    for (let i = 0; i < dir.length - 1; i = i + 2) {
      const blockName = `${dir.length - 1}-${i}`;
      console.log(blockName);

      const ws = fs.createWriteStream(path.resolve(TMP_DIR, blockName));
      const blockA = getAsyncIterator(await loadBlock(dir[i]));
      const blockB = getAsyncIterator(await loadBlock(dir[i + 1]));
      let lineA: string = await getNextValue(blockA);
      let lineB: string = await getNextValue(blockB);

      while (lineA && lineB) {
        if (lineA.localeCompare(lineB) <= 0) {
          ws.write(lineA);
          ws.write(DELIMITER);
          lineA = await getNextValue(blockA);
        } else {
          ws.write(lineB);
          ws.write(DELIMITER);
          lineB = await getNextValue(blockB);
        }
      }

      while (lineA) {
        ws.write(lineA);
        ws.write(DELIMITER);
        lineA = await getNextValue(blockA);
      }

      while (lineB) {
        ws.write(lineB);
        ws.write(DELIMITER);
        lineB = await getNextValue(blockB);
      }

      ws.close();

      await fs.promises.rm(path.resolve(TMP_DIR, dir[i]));
      await fs.promises.rm(path.resolve(TMP_DIR, dir[i + 1]));
    }
    dir = await fs.promises.readdir(TMP_DIR);
  }

  await fs.promises.cp(path.resolve(TMP_DIR, dir[0]), OUTPUT_FILE);
  fs.promises.rm(TMP_DIR, { recursive: true, force: true });
};

const main = async () => {
  await fs.promises.rm(TMP_DIR, { recursive: true, force: true });

  try {
    await fs.promises.stat(TMP_DIR);
  } catch (error) {
    await fs.promises.mkdir(TMP_DIR, { recursive: true });
  }

  await splitInput();

  mergeBlocks();
};

main();
