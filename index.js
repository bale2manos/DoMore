const http = require("http");
const fs = require("fs");

const PORT = 3000;


const serveStaticFile = async (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, function (err, data) {
      if (err) reject(err);
      resolve(data);
    });
  });
};

const sendResponse = (response, content, contentType) => {
  response.writeHead(200, { "Content-Type": contentType });
  response.end(content);
};

const handleRequest = async (request, response) => {
  const url = request.url;

  if (request.method === "GET") {
    let content;
    let contentType;
    switch (url) {
      case "/":
      case "/index.html":
        content = await serveStaticFile("www/index.html");
        contentType = "text/html";
        break;
      case "/script.js":
        content = await serveStaticFile("www/script.js");
        contentType = "text/javascript";
        break;
      case "/style.css":
        content = await serveStaticFile("www/style.css");
        contentType = "text/css";
        break;
      case "/tasks/get":
        content = await serveStaticFile("tasks.json");
        contentType = "application/json";
        break;
      case "/tasks/darkMode":
        content = await serveStaticFile("user_info.json");
        contentType = "application/json";
        break;
      case "/favicon.ico":
        content = await serveStaticFile("www/todo_icon.png");
        contentType = "image/png";
        break;
      case "/anote.ttf":
        content = await serveStaticFile("www/anote.ttf");
        contentType = "font/ttf";
        break;
      
      default:
        console.log(process.cwd() + url);
        content = "Ruta no valida\r\n";
        contentType = "text/html";
    }
    sendResponse(response, content, contentType);
  } else if (request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });

    request.on("end", async () => {
      let requestData;
      try {
        requestData = JSON.parse(body);
      } catch (error) {
        console.error("Error parsing request body:", error);
        response.writeHead(400, { "Content-Type": "text/plain" });
        response.end("Bad request");
        return;
      }
      console.log(requestData);
      switch (url) {
        case "/tasks/update":
          console.log("All tasks are: ", requestData);
          // Write requestData to file
          fs.writeFile("tasks.json", JSON.stringify(requestData), (err) => {
            if (err) {
              console.error("Error writing tasks to file:", err);
              response.writeHead(500, { "Content-Type": "text/plain" });
              response.end("Internal server error");
            } else {
              console.log("Tasks written to file successfully");
              response.writeHead(200, { "Content-Type": "text/plain" });
              response.end(JSON.stringify({ success: true }));
            }
          });
          break;
        case "/tasks/darkMode":
          console.log("Dark mode is: ", requestData);
          // Write requestData to file
          fs.writeFile("user_info.json", JSON.stringify(requestData), (err) => {
            if (err) {
              console.error("Error writing darkMode to file:", err);
              response.writeHead(500, { "Content-Type": "text/plain" });
              response.end("Internal server error");
            } else {
              console.log("Dark mode written to file successfully");
              response.writeHead(200, { "Content-Type": "text/plain" });
              response.end(JSON.stringify({ success: true }));
            }
          });
          break;
        default:
          console.log("Invalid URL in POST:", url);
          console.error("Invalid URL in POST:", url);
          response.writeHead(404, { "Content-Type": "text/plain" });
          response.end("Not found");
      }
    });
  }
};

const server = http.createServer(handleRequest);
server.listen(PORT);
