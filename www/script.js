const taskList = [];

const loadTasks = async () => {
  const response = await fetch("/tasks/get");
  const jsonText = await response.json();
  console.log(jsonText);
  
}

loadTasks();

const add = () => {}

const remove = () => {}

const toggleDone = () => {}

const addButton = document.querySelector("#fab-add");

addButton.addEventListener("touchend", add);


