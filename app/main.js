const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require('crypto');

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const command = process.argv[2];

switch (command) {
  case "init":
    createGitDirectory();
    break;
  case "cat-file":
    const hash = process.argv[4];
    readBlobContent(hash);
    break;
  case "hash-object":
    computeHash();
    break;
  case "ls-tree":
    const treeHash = process.argv[4];
    process.stdout.print(readTree(treeHash));
    break;
  case "write-tree":
    const wd = path.join(process.cwd(), ".git", "objects");
    console.log("Hello");
    process.std.write(createTree(wd));
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".git"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), ".git", "HEAD"), "ref: refs/heads/main\n");
  console.log("Initialized git directory");
}
async function readBlobContent(hash) {
  const content = await fs.readFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2))); //reads blob content at 
	const dataUnzipped = zlib.inflateSync(content); 
	const res = dataUnzipped.toString().split('\0')[1]; //
	process.stdout.write(res); // print result to stdout
}
function computeHash(){
  // hash = file.slice(0,2) + file.slice(2);
// header + size
if (process.argv[3] !== "-w"){
  return;
}
  const file = process.argv[4];
  // const data = fs.readFileSync(file, 'utf-8');
  // const size = data.length;
  // const header = `blob ${size}\x00`;
  // const store = header + data;
  const hash = createBlob(file);
  try {
    fs.mkdirSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2)), { recursive: true});
    fs.writeFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2)), zlib.deflateSync(store));
    } catch (err) {
      console.log("Error: Couldn't Write File");
    }
    process.stdout.write(createBlob(file));
  } 
async function readTree(hash){
  const content = await fs.readFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2), hash.slice(2))); // reads tree content
  const dataUnzipped = zlib.inflateSync(content); // zlib compression
  const elements = dataUnzipped.toString();
  const arrayOfElements = elements.split('\0');
  names = ""
  for (let i = 1; i < arrayOfElements.length - 1; i++){
    names += arrayOfElements[i].split(" ")[1] + "\n";
  }
  process.stdout.write(names);
}


function iterateTree(dirPath){
  console.log("Checkpoint 1\n");
  const entries = [];
  fs.readdirSync(dirPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }
    console.log("CheckPoint 2\n");
    files.forEach(file => {
      console.log("CheckPoint 3\n");
      const fullPath = path.join(dirPath, file);
      let mode, hash, entry;
      fs.lstatSync(fullPath, (err, stats) => {
        if (err) {
          console.error('Error getting stats for file:', err);
          return;
        }
        console.log("CheckPoint 4\n");
        if (stats.isFile()) {
          mode = "100644";
          hash = createBlob(file);
        } else if (stats.isDirectory()) {
          mode = "40000";
          hash = createTree(fullPath);
        }

        if (mode && hash) {
          console.log("CheckPoint 5\n");
          if (mode === "40000"){
            entry = `${mode} ${item}\0${Buffer.from(hash, 'binary')}`;
          } else {
            entry = `${mode} ${item}\0${Buffer.from(hash, 'hex')}`;
          }
          entries.push(Buffer.from(entry));
          console.log("CheckPoint 6\n");
        }
      });
      
    });
  });
  console.log("CheckPoint 7\n");
  return entries;
}

function createBlob(file){
  // creates blob and returns hash
  const data = fs.readFileSync(file, 'utf-8');
  const size = data.length;
  const header = `blob ${size}\x00`;
  const store = Buffer.concat([Buffer.from(header), data]);
  return crypto.createHash('sha1').update(store).digest('hex');
}

function createTree(filePath){
  // this is the last step
  const entries = iterateTree(filePath);
  for (let x in entries) {
    console.log(entries[x]);
  }
  const treeContent = Buffer.concat(entries);
  const header = `tree ${treeContent.length}\0`;
  const store = Buffer.concat([Buffer.from(header), treeContent]);
  const hash = crypto.createHash('sha1').update(store).digest("binary");
  if (filePath == path.join(process.cwd(), ".git", "objects")){
      fs.mkdirSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2)), { recursive: true});
      fs.writeFileSync(path.join(process.cwd(), ".git", "objects", hash.slice(0, 2)), hash.slice(2), hash);
  }
  return hash; // cannot be hex
}

