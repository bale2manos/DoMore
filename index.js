const http = require('http');
const fs = require('fs');

const PORT = 3000;

const serveStaticFile = async (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
} 

const sendResponse = (response, content, contentType) => {
  response.writeHead(200, {"Content-Type": contentType});
  response.end(content);
}

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
    let body = '';
    request.on('data', (chunk) => {
      body += chunk.toString();
    });

    request.on('end', async () => {
      let requestData;
      try {
        requestData = JSON.parse(body);
      } catch (error) {
        console.error('Error parsing request body:', error);
        response.writeHead(400, { 'Content-Type': 'text/plain' });
        response.end('Bad request');
        return;
      }
      console.log(requestData);
      const { taskId, title, taskDone } = requestData;
      const taskName = title;
      switch (url) {
        case "/tasks/add":
          // Read current tasks from file
          console.log(taskName);
          let tasksData_add = await serveStaticFile("tasks.json");
          console.log(tasksData_add);
          const tasks_add = JSON.parse(tasksData_add);

          // Find the next available task ID
          const nextId = tasks_add.length > 0 ? tasks_add[tasks_add.length - 1].id + 1 : 1;
          // Add the new task to the tasks array
          tasks_add.push({ id: nextId, title: taskName, done: false });
          console.log('bien hasta aqui')
          // Write updated tasks back to file
          fs.writeFile('tasks.json', JSON.stringify(tasks_add), (err) => {
            if (err) {
              console.error('Error writing tasks to file:', err);
              response.writeHead(500, { 'Content-Type': 'text/plain' });
              response.end('Internal server error');
            } else {
              console.log(`Task added successfully`);
              response.writeHead(200, { 'Content-Type': 'application/json' });
              response.end(JSON.stringify({ success: true }));
            }
          });
          
          console.log('bien hasta el final')
          break;
        case "/tasks/remove":
          // Read current tasks from file
          const tasksData = await serveStaticFile("tasks.json");
          const tasks = JSON.parse(tasksData);

          // Find index of task to remove
          const index = tasks.findIndex(task => task.id === taskId);
          if (index !== -1) {
            // Remove task from array
            tasks.splice(index, 1);

            // Write updated tasks back to file
            fs.writeFile('tasks.json', JSON.stringify(tasks), (err) => {
              if (err) {
                console.error('Error writing tasks to file:', err);
                response.writeHead(500, { 'Content-Type': 'text/plain' });
                response.end('Internal server error');
              } else {
                console.log(`Task with ID ${taskId} removed successfully`);
                response.writeHead(200, { 'Content-Type': 'text/plain' });
                response.end('Task removed successfully');
              }
            });
          }
          else {
            console.error(`Task with ID ${taskId} not found`);
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('Task not found');
          }
          break;
      case "/tasks/toggleDone":
        let body = '';
        request.on('data', chunk => {
          body += chunk.toString();
        });
        console.log("This is the body: ", body);
        request.on('end', async () => {
          console.log("Entro");
          try {
            const tasksList = JSON.parse(body).tasks;
            console.log("This is the taskList: ", tasksList);

            await fs.promises.writeFile('tasks.json', JSON.stringify(tasksList));
      
            console.log(`Tasks added successfully`);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ success: true }));
          } catch (err) {
            console.error('Error writing tasks to file:', err);
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end('Internal server error');
          }
        });
        break;
        default:
          console.log('Invalid URL:', url);
          console.error('Invalid URL:', url);
          response.writeHead(404, { 'Content-Type': 'text/plain' });
          response.end('Not found');
      }
    });
  }
};








const server = http.createServer(handleRequest);
server.listen(PORT);