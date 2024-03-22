const taskList = [];
const tasksContainer = document.getElementById("task-container");

const showLoadingModal = () => {
  Swal.fire({
    title: 'Loading...',
    html: 'Please wait while tasks are being loaded...',
    allowOutsideClick: false,
    showConfirmButton: false 
  });
};

const hideLoadingModal = () => {
  Swal.close();
};


showLoadingModal();


const taskContainerWrapper = document.querySelector(".task-container-wrapper");
const darkModeButton = document.getElementById("dark-mode-toggle");
const darkModeText = document.getElementById("dark-mode-state");
new SimpleBar(taskContainerWrapper, { autoHide: false });

const enableDarkMode = () => {
  document.body.classList.add("dark-mode");
  darkModeButton.style.backgroundColor = "#595959"; 
  darkModeText.textContent = "Day";
  darkModeText.style.color = "#fff"
};

const disableDarkMode = () => {
  document.body.classList.remove("dark-mode");
  darkModeButton.style.backgroundColor = "#fff"; 
  darkModeText.textContent = "Night";
  darkModeText.style.color = "#333";
};


const fetchDarkModeStatus = async () => {
  try {
      const response = await fetch('/tasks/darkMode');
      if (response.ok) {
          console.log('Dark mode status fetched successfully'); 
          const data = await response.json();
          return data.darkMode;
      } else {
          console.error('Failed to fetch dark mode status');
          return false; 
      }
  } catch (error) {
      console.error('Error fetching dark mode status:', error);
      return false; 
  }
};

const updateDarkModeStatus = async (darkMode) => {
  try {
      const response = await fetch('/tasks/darkMode', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ darkMode })
      });
      if (!response.ok) {
          console.error('Failed to update dark mode status');
      }
  } catch (error) {
      console.error('Error updating dark mode status:', error);
  }
};

const toggleDarkMode = async () => {
  let newDarkModeStatus = !document.body.classList.contains("dark-mode");
  await updateDarkModeStatus(newDarkModeStatus);
  if (newDarkModeStatus) {
      enableDarkMode();

  } else {
      disableDarkMode();

  }
};

const darkModeToggle = document.getElementById("dark-mode-toggle");
darkModeToggle.addEventListener("click", toggleDarkMode); 

const loadTasks = async () => {

  setTimeout(async () => {
    try {
      const response = await fetch("/tasks/get");
      const tasks = await response.json();

      tasks.forEach((task) => {
        taskList.push(task);

        const taskElement = document.createElement("div");
        taskElement.classList.add("task-item");
        taskElement.innerHTML = task.title;
        taskElement.dataset.taskId = task.id;
        if (task.done) {
          taskElement.style.backgroundColor = "#90be6d"; 
        }
        tasksContainer.appendChild(taskElement); 
      });

      hideLoadingModal();
    } catch (error) {
      console.error('Error loading tasks:', error);
      hideLoadingModal();
    }
  }, 1000); 
};


console.log(taskList);

const initializeApp = async () => {
  loadTasks();
  const darkModeStatus = await fetchDarkModeStatus();
  console.log(darkModeStatus);
  console.log(`Dark mode status: ${darkModeStatus}`);
  if (darkModeStatus) {
      enableDarkMode();
  } else {
      disableDarkMode();
  }
};

initializeApp();
const addButton = document.querySelector("#fab-add");

const resetButonStyle = () => {
  const fabAddButton = document.getElementById("fab-add");
  setTimeout(() => {
    fabAddButton.style.backgroundColor = "#7367f0";
    fabAddButton.style.color = "white"; 
    fabAddButton.style.transform = "scale(1)"; 
  }, 450);
};

const setButtonStyleForTask = () => {
  addButton.style.backgroundColor = "#90be6d"; 
  addButton.style.transform = "scale(1.1)"; 
  resetButonStyle();
};

const setButtonStyleForEmptyTask = () => {
  addButton.style.backgroundColor = "#ef9a9a"; 
  addButton.style.transform = "scale(1.1)"; 
};

const add = async () => {
  const taskNameInput = document.getElementById("task-name");
  const taskName = taskNameInput.value.trim(); 

  if (taskName !== "") {
    console.log(`Adding task: ${taskName}`);
    let nextId;
    if (taskList.length > 0) {
        let largestId = Math.max(...taskList.map(task => task.id));
        nextId = largestId + 1;
    } else {
        nextId = 1;
    }

    const newTask = { id: nextId, title: taskName, done: false };
    taskList.unshift(newTask); 
    createTaskHTML(nextId, taskName);
    let response = await send_tasks_to_server();
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const responseData = await response.json();

    Swal.fire({
      toast: true,
      position: 'top-end', 
      icon: 'success',
      showConfirmButton: false,
      timer: 2000, 
      text: `Tarea: ${taskName} añadida`
    });
  } else {
    setButtonStyleForEmptyTask();

    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "¡Debes ingresar el nombre de la tarea!",
    }).then(() => {
      resetButonStyle();
    });
  }

  function createTaskHTML(taskId, taskName) {
      
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-item");
      taskElement.innerHTML = taskName;
      taskElement.dataset.taskId = taskId;
      tasksContainer.insertBefore(taskElement, tasksContainer.firstChild);

      taskNameInput.value = "";

      console.log("Tarea agregada!");
      console.log(taskList);

      setButtonStyleForTask();
};
};
addButton.addEventListener("click", add);

const taskNameInput = document.getElementById("task-name");
taskNameInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    add();
  }
});

const remove = (taskId) => {
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);

  taskElement.classList.add("remove-transition");
  taskList.splice(
    taskList.findIndex((task) => task.id === taskId),
    1
  );
  Swal.fire({
    toast: true,
    position: 'top-end', 
    icon: 'warning', 
    showConfirmButton: false,
    timer: 2000, 
    text: 'Tarea eliminada'
  });
  

  taskElement.addEventListener(
    "transitionend",
    async () => {
      taskElement.remove();

      await send_tasks_to_server();
    },
    { once: true }
  ); 
};

const remove_uncompleted = (taskId) => {
  console.log(`Removing task with ID ${taskId}...`);
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);

  taskElement.classList.add("remove-transition-uncompleted");

  setTimeout(() => {
    taskElement.classList.remove("remove-transition-uncompleted");

    taskElement.style.transition = "transform 0.3s ease-out";
    taskElement.style.transform = "translateX(0)";

    taskElement.addEventListener(
      "transitionend",
      () => {
        taskElement.style.transition = "";
        taskElement.style.transform = "";
      },
      { once: true }
    );
  }, 300); 
};


tasksContainer.addEventListener("touchstart", (event) => {
  const taskElement = event.target.closest(".task-item"); 
  if (!taskElement) return; 

  const initialX = event.touches[0].clientX; 
  const taskId = parseInt(taskElement.dataset.taskId);
  console.log(`Touchstart event on task with ID ${taskId}`);

  const handleTouchMove = (moveEvent) => {
    const currentX = moveEvent.touches[0].clientX; 
    const deltaX = currentX - initialX; 
    console.log(`DeltaX: ${deltaX}`);

    if (deltaX > 2.4) {
      console.log(`Swipe right on task with ID ${taskId}`);
      if (!isNaN(taskId)) {
        remove(taskId); 
      }
    } else {
      if (!isNaN(taskId)) {
        remove_uncompleted(taskId); 
      }
    }

    tasksContainer.removeEventListener("touchmove", handleTouchMove);
  };

  tasksContainer.addEventListener("touchmove", handleTouchMove);
});

let timeStart = 0;

const toggleDone = async (taskId) => {
  const taskIndex = taskList.findIndex((task) => task.id === taskId);
  if (taskIndex !== -1) {
    const task = taskList[taskIndex];
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);

    const targetColor = task.done ? "#f9844a" : "#90be6d";
    const originalColor = task.done ? "#90be6d" : "#f9844a";

    gsap.to(taskElement, {
      duration: 2,
      backgroundColor: targetColor,
      ease: "power2.inOut",
      onComplete: async () => {
        task.done = !task.done;

        if (task.done) {
          const doneTasks = taskList.filter((t) => t.done);
          const undoneTasks = taskList.filter((t) => !t.done);

          taskList.splice(taskIndex, 1);

          let insertIndex;
          if (doneTasks.length > 0) {
            insertIndex = Math.max(
              undoneTasks.length,
              undoneTasks.findIndex((t) => t.id > doneTasks[doneTasks.length - 1].id)
            );
          } else {
            insertIndex = undoneTasks.length;
          }

          taskList.splice(insertIndex, 0, task);

          tasksContainer.removeChild(taskElement);
          tasksContainer.insertBefore(taskElement, tasksContainer.children[insertIndex]);
        } else {
          taskList.splice(taskIndex, 1);
          taskList.unshift(task);
          tasksContainer.removeChild(taskElement);
          tasksContainer.insertBefore(taskElement, tasksContainer.firstChild);
        }

        await send_tasks_to_server(taskId, task);
      },
    }); 

    taskElement.addEventListener("touchend", () => {
      gsap.killTweensOf(taskElement);
      const elapsedTime = new Date().getTime() - timeStart;
      if (elapsedTime < 2000) {
        gsap.to(taskElement, {
          duration: 0.1, 
          backgroundColor: originalColor,
          ease: "power2.inOut",
        });
      }
    });
  }
};


tasksContainer.addEventListener("touchstart", (event) => {
  event.preventDefault();
  timeStart = new Date().getTime(); 
  const taskId = parseInt(event.target.dataset.taskId);
  if (!isNaN(taskId)) {
    toggleDone(taskId); 
  }
});


async function send_tasks_to_server() {
  let response;
  try {
    response = await fetch("/tasks/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskList), 
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(`Tareas enviadas al servidor: ${taskList}`);
  } catch (error) {
    console.error("Error toggling task status:", error);
  }
  return response;
}



darkModeToggle.addEventListener("click", toggleDarkMode);
