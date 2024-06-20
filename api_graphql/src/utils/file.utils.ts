import { createWriteStream, readFile } from 'fs';
import { Duplex, Readable } from 'stream';

export async function getFileContent(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    readFile(path, { encoding: 'utf8' }, (err, fileContent: string) => {
      err ? reject(err) : resolve(fileContent);
    });
  });
}

export function bufferToStream(buffer: Buffer) {
  const stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export function stringToStream(content: string) {
  const buffer = Buffer.from(content);
  return bufferToStream(buffer);
}

export async function saveFileStream(filePath: string, fileStream: Readable) {
  return new Promise((resolve, reject) => {
    fileStream
      .pipe(createWriteStream(filePath, { flags: 'w' }))
      .on('close', resolve)
      .on('error', reject);
  });
}

export async function saveFileContent(filePath: string, content: string) {
  return saveFileStream(filePath, stringToStream(content));
}
