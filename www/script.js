const taskList = [];
const tasksContainer = document.getElementById('task-container');

const loadTasks = async () => {
  const response = await fetch("/tasks/get");
  const tasks = await response.json();
  
  document.body.appendChild(tasksContainer); // Agrega el contenedor al final del body

  tasks.forEach(task => {
    // Agregar la tarea al array taskList
    taskList.push(task);

    const taskElement = document.createElement('div');
    taskElement.classList.add('task-item'); // Añade una clase CSS para estilizar la tarea
    taskElement.innerHTML = task.title;
    taskElement.dataset.taskId = task.id; // Añadir atributo data-task-id con el ID de la tarea
    if (task.done) {
      taskElement.style.backgroundColor = '#90be6d'; // Cambia el color a verde si la tarea está hecha
    }
    tasksContainer.appendChild(taskElement); // Agrega la tarea al contenedor de tareas
  });
}



loadTasks();
console.log(taskList);


const add = async () => {
  const taskNameInput = document.getElementById('task-name');
  const taskName = taskNameInput.value.trim(); // Get the value from the input field, removing leading and trailing whitespace

  if (taskName !== '') {
    console.log(`Adding task: ${taskName}`);
    try {
      // Send a POST request to the server to add the new task
      const response = await fetch("/tasks/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({title: taskName }) // Send the action and task title in JSON format
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the response JSON data
      const responseData = await response.json();

      // Check if the task was added successfully
      if (responseData.success) {
        console.log("Tarea agregada!");
        // If successful, update the task list locally
        const nextId = taskList.length > 0 ? taskList[taskList.length - 1].id + 1 : 1;
        const newTask = { id: nextId, title: taskName, done: false };
        taskList.push(newTask);

        // Create a new task element and append it to the tasks container
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-item');
        taskElement.innerHTML = taskName;
        taskElement.dataset.taskId = nextId;
        tasksContainer.appendChild(taskElement);

        // Clear the input field
        taskNameInput.value = '';

        console.log("Tarea agregada!");
        console.log(taskList);
      } else {
        // If not successful, display an error message
        console.error("Error adding task:", responseData.message);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  } else {
    // Show an error message if the input field is empty
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: '¡Debes ingresar el nombre de la tarea!'
    });
  }
};


const addButton = document.querySelector("#fab-add");
addButton.addEventListener("click", add);

const taskNameInput = document.getElementById('task-name');
taskNameInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    add();
  }
});

const remove = (taskId) => {
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  
  // Apply a transition effect to smoothly remove the task item
  taskElement.classList.add('remove-transition');

  // Wait for the transition to complete before removing the task item from the DOM
  taskElement.addEventListener('transitionend', async () => {
    // Remove the task from the DOM
    taskElement.remove();

    try {
      // Send a POST request to the server to remove the task using /tasks/remove endpoint
      const response = await fetch('/tasks/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({taskId: taskId }) // Include action and taskId
      });

      if (response.ok) {
        console.log(`Task with ID ${taskId} removed successfully from the server.`);
        // Update the taskList if the removal was successful
        const index = taskList.findIndex(task => task.id === taskId);
        if (index !== -1) {
          taskList.splice(index, 1);
          console.log(`Task with ID ${taskId} removed from taskList.`);
        } else {
          console.log(`Task with ID ${taskId} not found in taskList.`);
        }
      } else {
        console.error(`Failed to remove task with ID ${taskId} from the server.`);
      }
    } catch (error) {
      console.error('Error removing task:', error);
    }
  }, { once: true }); // Ensure the event listener is only triggered once
}




const remove_uncompleted = (taskId) => {
  console.log(`Removing task with ID ${taskId}...`);
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);

  // Apply the remove-transition-uncompleted class to slide the task item to the left
  taskElement.classList.add('remove-transition-uncompleted');


  // After a short delay, remove the remove-transition-uncompleted class
  setTimeout(() => {
    taskElement.classList.remove('remove-transition-uncompleted');

    // Reset the task item's transform to move it back to its original position
    taskElement.style.transition = 'transform 0.3s ease-out';
    taskElement.style.transform = 'translateX(0)';

    // Remove the transition effect after it completes
    taskElement.addEventListener('transitionend', () => {
      taskElement.style.transition = '';
      taskElement.style.transform = '';
    }, { once: true });
  }, 300); // Adjust the delay as needed to match the animation duration
}



// Event listener for touch events on task items

tasksContainer.addEventListener('touchstart', (event) => {
  const taskElement = event.target.closest('.task-item'); // Find the closest task item
  if (!taskElement) return; // Exit if the touch didn't start on a task item

  const initialX = event.touches[0].clientX; // Initial touch position
  const taskId = parseInt(taskElement.dataset.taskId);
  console.log(`Touchstart event on task with ID ${taskId}`);

  const handleTouchMove = (moveEvent) => {
    const currentX = moveEvent.touches[0].clientX; // Current touch position
    const deltaX = currentX - initialX; // Horizontal distance traveled
    console.log(`DeltaX: ${deltaX}`);

    // If swipe gesture from left to right
    if (deltaX > 10) { // Adjust threshold as needed
      console.log(`Swipe right on task with ID ${taskId}`);
      if (!isNaN(taskId)) {
        remove(taskId); // Remove the task item
      }
    }
    else{
        if (!isNaN(taskId)) {
          remove_uncompleted(taskId); // Remove the task item
        }
    }

    // Remove touchmove event listener after swipe
    tasksContainer.removeEventListener('touchmove', handleTouchMove);
  };

  // Event listener for touchmove to track swipe gesture
  tasksContainer.addEventListener('touchmove', handleTouchMove);
});



let timeStart = 0;

const toggleDone = async (taskId) => {
  const task = taskList.find(task => task.id === taskId);
  if (task) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    
    // Set a flag to determine whether the animation should proceed
    let shouldAnimate = true;

    // Determine the target color based on the task's current state
    const targetColor = task.done ? '#f9844a' : '#90be6d';
    const originalColor = task.done ? '#90be6d' : '#f9844a';

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

          // Send a request to the server to update the task's 'done' status
          try {
            const response = await fetch(`/tasks/toggleDone`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ taskId: taskId})
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log(`Estado de la tarea con ID ${taskId} cambiado a ${task.done}`);
          } catch (error) {
            console.error('Error toggling task status:', error);
          }
        }
      }
    });

    // Event listener to cancel the animation if the user releases the finger before 2 seconds
    taskElement.addEventListener('touchend', () => {
      shouldAnimate = false;
      gsap.killTweensOf(taskElement);
      const elapsedTime = new Date().getTime() - startTime;
      if (elapsedTime < 2000) {
        gsap.to(taskElement, {
          duration: 0.1, // Adjust duration as needed
          backgroundColor: originalColor,
          ease: "power2.inOut"
        });
      }
    });
  }
}


// Event listeners for touch events
tasksContainer.addEventListener('touchstart', (event) => {
  timeStart = new Date().getTime(); // Record the start time when the user touches the screen
  const taskId = parseInt(event.target.dataset.taskId);
  if (!isNaN(taskId)) {
    toggleDone(taskId); // Start the animation on touch start
  }
});


