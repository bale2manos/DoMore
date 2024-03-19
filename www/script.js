const taskList = [];
const tasksContainer = document.getElementById("task-container");

// Inicializar SimpleBar en el contenedor de tareas
const taskContainerWrapper = document.querySelector(".task-container-wrapper");
new SimpleBar(taskContainerWrapper, { autoHide: false });

const loadTasks = async () => {
  const response = await fetch("/tasks/get");
  const tasks = await response.json();

  tasks.forEach((task) => {
    // Agregar la tarea al array taskList
    taskList.push(task);

    const taskElement = document.createElement("div");
    taskElement.classList.add("task-item"); // Añade una clase CSS para estilizar la tarea
    taskElement.innerHTML = task.title;
    taskElement.dataset.taskId = task.id; // Añadir atributo data-task-id con el ID de la tarea
    if (task.done) {
      taskElement.style.backgroundColor = "#90be6d"; // Cambia el color a verde si la tarea está hecha
    }
    tasksContainer.appendChild(taskElement); // Agrega la tarea al contenedor de tareas
  });
};

loadTasks();
console.log(taskList);
const addButton = document.querySelector("#fab-add");

const resetButonStyle = () => {
  const fabAddButton = document.getElementById("fab-add");
  setTimeout(() => {
    fabAddButton.style.backgroundColor = "#7367f0"; // Restaurar color de fondo
    fabAddButton.style.color = "white"; // Restaurar color de texto
    fabAddButton.style.transform = "scale(1)"; // Restaurar tamaño
  }, 450);
};

const setButtonStyleForTask = () => {
  addButton.style.backgroundColor = "#90be6d"; // Cambiar color de fondo
  addButton.style.transform = "scale(1.1)"; // Aumentar tamaño
  resetButonStyle();
};

const setButtonStyleForEmptyTask = () => {
  addButton.style.backgroundColor = "#ef9a9a"; // Cambiar color de fondo
  addButton.style.transform = "scale(1.1)"; // Reducir tamaño
};

const add = async () => {
  const taskNameInput = document.getElementById("task-name");
  const taskName = taskNameInput.value.trim(); // Obtener el valor del campo de entrada, eliminando espacios en blanco iniciales y finales

  if (taskName !== "") {
    console.log(`Adding task: ${taskName}`);
    let response = await send_tasks_to_server();
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Analizar los datos JSON de la respuesta
    const responseData = await response.json();

    // Verificar si la tarea se agregó correctamente
    createTaskHTML(responseData);
  } else {
    // Tarea vacía
    // Mostrar un mensaje de error si el campo de entrada está vacío
    setButtonStyleForEmptyTask();

    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "¡Debes ingresar el nombre de la tarea!",
    }).then(() => {
      resetButonStyle();
    });
  }

  function createTaskHTML(responseData) {
    if (responseData.success) {
      console.log("Tarea agregada!");
      // Si se agrega correctamente, actualizar la lista de tareas localmente
      const nextId =
        taskList.length > 0 ? taskList[taskList.length - 1].id + 1 : 1;
      const newTask = { id: nextId, title: taskName, done: false };
      taskList.push(newTask);

      // Crear un nuevo elemento de tarea y agregarlo al contenedor de tareas
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-item");
      taskElement.innerHTML = taskName;
      taskElement.dataset.taskId = nextId;
      tasksContainer.appendChild(taskElement);

      // Limpiar el campo de entrada
      taskNameInput.value = "";

      console.log("Tarea agregada!");
      console.log(taskList);

      // Establecer estilos para el botón cuando se agrega una tarea con texto
      setButtonStyleForTask();
    } else {
      // Si no se agrega correctamente, mostrar un mensaje de error
      console.error("Error adding task:", responseData.message);
    }
  }
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

  // Apply a transition effect to smoothly remove the task item
  taskElement.classList.add("remove-transition");
  taskList.splice(
    taskList.findIndex((task) => task.id === taskId),
    1
  );

  // Wait for the transition to complete before removing the task item from the DOM
  taskElement.addEventListener(
    "transitionend",
    async () => {
      // Remove the task from the DOM
      taskElement.remove();

      await send_tasks_to_server();
    },
    { once: true }
  ); // Ensure the event listener is only triggered once
};

const remove_uncompleted = (taskId) => {
  console.log(`Removing task with ID ${taskId}...`);
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);

  // Apply the remove-transition-uncompleted class to slide the task item to the left
  taskElement.classList.add("remove-transition-uncompleted");

  // After a short delay, remove the remove-transition-uncompleted class
  setTimeout(() => {
    taskElement.classList.remove("remove-transition-uncompleted");

    // Reset the task item's transform to move it back to its original position
    taskElement.style.transition = "transform 0.3s ease-out";
    taskElement.style.transform = "translateX(0)";

    // Remove the transition effect after it completes
    taskElement.addEventListener(
      "transitionend",
      () => {
        taskElement.style.transition = "";
        taskElement.style.transform = "";
      },
      { once: true }
    );
  }, 300); // Adjust the delay as needed to match the animation duration
};

// Event listener for touch events on task items

tasksContainer.addEventListener("touchstart", (event) => {
  const taskElement = event.target.closest(".task-item"); // Find the closest task item
  if (!taskElement) return; // Exit if the touch didn't start on a task item

  const initialX = event.touches[0].clientX; // Initial touch position
  const taskId = parseInt(taskElement.dataset.taskId);
  console.log(`Touchstart event on task with ID ${taskId}`);

  const handleTouchMove = (moveEvent) => {
    const currentX = moveEvent.touches[0].clientX; // Current touch position
    const deltaX = currentX - initialX; // Horizontal distance traveled
    console.log(`DeltaX: ${deltaX}`);

    // If swipe gesture from left to right
    if (deltaX > 10) {
      // Adjust threshold as needed
      console.log(`Swipe right on task with ID ${taskId}`);
      if (!isNaN(taskId)) {
        remove(taskId); // Remove the task item
      }
    } else {
      if (!isNaN(taskId)) {
        remove_uncompleted(taskId); // Remove the task item
      }
    }

    // Remove touchmove event listener after swipe
    tasksContainer.removeEventListener("touchmove", handleTouchMove);
  };

  // Event listener for touchmove to track swipe gesture
  tasksContainer.addEventListener("touchmove", handleTouchMove);
});

let timeStart = 0;

const toggleDone = async (taskId) => {
  const task = taskList.find((task) => task.id === taskId);
  if (task) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);

    // Set a flag to determine whether the animation should proceed
    let shouldAnimate = true;

    // Determine the target color based on the task's current state
    const targetColor = task.done ? "#f9844a" : "#90be6d";
    const originalColor = task.done ? "#90be6d" : "#f9844a";

    // Record the start time when the user touches the task
    const startTime = new Date().getTime();

    // Animate the background color change
    gsap.to(taskElement, {
      duration: 2,
      backgroundColor: targetColor,
      ease: "power2.inOut",
      onComplete: async () => {
        // Calculate the duration of the hold
        const holdDuration = new Date().getTime() - startTime;

        // If the hold duration is longer than 2 seconds and the animation should proceed
        if (shouldAnimate && holdDuration >= 2000) {
          // Update the task's state after 2 seconds if the animation should proceed
          task.done = !task.done;

          console.log(taskList);
          console.log(JSON.stringify(taskList));
          // Send a request to the server to update the task's 'done' status
          await send_tasks_to_server(taskId, task);
        }
      },
    });

    // Event listener to cancel the animation if the user releases the finger before 2 seconds
    taskElement.addEventListener("touchend", () => {
      shouldAnimate = false;
      gsap.killTweensOf(taskElement);
      const elapsedTime = new Date().getTime() - startTime;
      if (elapsedTime < 2000) {
        gsap.to(taskElement, {
          duration: 0.1, // Adjust duration as needed
          backgroundColor: originalColor,
          ease: "power2.inOut",
        });
      }
    });
  }
};

// Event listeners for touch events
tasksContainer.addEventListener("touchstart", (event) => {
  timeStart = new Date().getTime(); // Record the start time when the user touches the screen
  const taskId = parseInt(event.target.dataset.taskId);
  if (!isNaN(taskId)) {
    toggleDone(taskId); // Start the animation on touch start
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
      body: JSON.stringify(taskList), // Send the task list in JSON format
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
