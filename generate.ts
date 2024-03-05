import fs from 'fs';
import { generateRandString } from './lib';

const INPUT_PATH = './input.txt';
const MAX_SIZE = 1024;
const LINE_SIZE = 16;
const DELIMITER = '\n';

const ws = fs.createWriteStream(INPUT_PATH);
let size = 0;
while (size <= MAX_SIZE) {
  ws.write(generateRandString());
  ws.write(DELIMITER);
  size += LINE_SIZE + 1;
}
