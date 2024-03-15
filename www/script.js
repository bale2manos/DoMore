const taskList = [];

const loadTasks = () => {
  fetch("/tasks/get")
  
}

const add = () => {}

const remove = () => {}

const toggleDone = () => {}

const addButton = document.querySelector("#fab-add");

addButton.addEventListener("touchend", add);


