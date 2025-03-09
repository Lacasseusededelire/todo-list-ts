import { jsPDF } from 'jspdf';
import TaskController from './controllers/controller';
import { Task, Project,Status } from './models/models';

const controller = new TaskController();

async function main() {
  await controller.initialize();
  await loadProjects();
  setupTaskForm();
  setupProjectForm();
  await loadTasks();
}

async function loadProjects() {
  const projects = await controller.getAllProjects();
  const projectList = document.getElementById('project-list');
  const projectSelect = document.getElementById('project-select') as HTMLSelectElement;
  const projectFilter = document.getElementById('project-filter') as HTMLSelectElement;

  if (projectList && projectSelect && projectFilter) {
    projectList.innerHTML = '';
    projectSelect.innerHTML = '<option value="">No Project</option>';
    projectFilter.innerHTML = '<option value="">All Projects</option>';

    projects.forEach(project => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${project.name}</span>
        <button onclick="deleteProject('${project.id}')">Delete</button>
      `;
      projectList.appendChild(li);

      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      projectSelect.appendChild(option);

      const filterOption = document.createElement('option');
      filterOption.value = project.id;
      filterOption.textContent = project.name;
      projectFilter.appendChild(filterOption);
    });
  }
}

function setupTaskForm() {
  const taskForm = document.getElementById('task-form') as HTMLFormElement;
  if (taskForm) {
    taskForm.onsubmit = async (event) => {
      event.preventDefault();
      const description = (document.getElementById('task-input') as HTMLInputElement).value;
      const plannedEndDate = new Date((document.getElementById('planned-end-date') as HTMLInputElement).value);
      const plannedEndTime = (document.getElementById('planned-end-time') as HTMLInputElement).value;
      const projectId = (document.getElementById('project-select') as HTMLSelectElement).value || '';

      if (plannedEndTime) {
        const [hours, minutes] = plannedEndTime.split(':').map(Number);
        plannedEndDate.setHours(hours, minutes);
      }

      await controller.createTask(description, plannedEndDate, projectId);
      await loadTasks();
      taskForm.reset();
    };
  }
}

function setupProjectForm() {
  const projectForm = document.getElementById('project-form') as HTMLFormElement;
  if (projectForm) {
    projectForm.onsubmit = async (event) => {
      event.preventDefault();
      const name = (document.getElementById('project-input') as HTMLInputElement).value.trim().toLowerCase();
      const projects = await controller.getAllProjects();
      const existingProject = projects.find(project => project.name.trim().toLowerCase() === name);

      if (existingProject) {
        alert('A project with this name already exists.');
        return;
      }

      await controller.addProject(name);
      await loadProjects();
      projectForm.reset();
    };
  }
}

async function loadTasks() {
  const statusFilter = (document.getElementById('status-filter') as HTMLSelectElement).value as Status;
  const projectFilter = (document.getElementById('project-filter') as HTMLSelectElement).value;
  const tasks = await controller.getTasksByStatusAndProject(statusFilter, projectFilter);
  const taskList = document.getElementById('todo-list');

  if (taskList) {
    taskList.innerHTML = '';
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = task.status === Status.Completed ? 'completed' : '';
      li.innerHTML = `
        <span>${task.description}</span>
        <span>Start: ${task.startDate}</span>
        <span>Planned End: ${task.plannedEndDate}</span>
        ${task.actualEndDate ? `<span>Actual End: ${task.actualEndDate}</span>` : ''}
        ${task.actualDuration !== null ? `<span>Duration: ${task.actualDuration}s</span>` : ''}
        <span>Status: ${task.status}</span>
        <div class="actions">
          <button onclick="startTask(${task.id})">Start</button>
          <button onclick="completeTask(${task.id})">Complete</button>
          <button onclick="editTask(${task.id})">Edit</button>
          <button onclick="deleteTask(${task.id})">Delete</button>
          <button onclick="getResources(${task.id})">Resources</button>
        </div>
      `;
      taskList.appendChild(li);
    });
  }
}

window.startTask = async (taskId: number) => {
  await controller.startTask(taskId);
  await loadTasks();
};

window.completeTask = async (taskId: number) => {
  await controller.completeTask(taskId);
  await loadTasks();
};

window.editTask = async (taskId: number) => {
  const task = await controller.getTaskById(taskId);
  if (task) {
    const description = prompt('Edit task description:', task.description);
    let plannedEndDateInput = prompt('Edit planned end date:', task.plannedEndDate.toISOString().split('T')[0]);
    let plannedEndTimeInput = prompt('Edit planned end time (HH:MM):', task.plannedEndDate.toTimeString().slice(0, 5));

    if (description !== null) {
      task.description = description;
    }

    if (plannedEndDateInput !== null && plannedEndTimeInput !== null) {
      const plannedEndDate = new Date(plannedEndDateInput);
      const [hours, minutes] = plannedEndTimeInput.split(':').map(Number);
      plannedEndDate.setHours(hours, minutes);
      task.plannedEndDate = plannedEndDate;
    }

    await controller.updateTask(task);
    await loadTasks();
  }
};

window.deleteTask = async (taskId: number) => {
  const confirmation = confirm('Are you sure you want to delete this task?');
  if (!confirmation) return;
  await controller.deleteTask(taskId);
  await loadTasks();
};

window.getResources = async (taskId: number) => {
  const task = await controller.getTaskById(taskId);
  if (task) {
    const resources = await controller.getResourcesForTask(task.description);
    alert(resources);
  }
};

window.deleteProject = async (projectId: string) => {
  const confirmation = confirm('Are you sure you want to delete this project and all its tasks?');
  if (!confirmation) return;

  // Supprimer les tâches associées au projet
  const tasks = await controller.getTasksByStatusAndProject(undefined, projectId);
  for (const task of tasks) {
    await controller.deleteTask(task.id);
  }

  // Supprimer le projet
  await controller.deleteProject(projectId);
  await loadProjects();
};

window.generatePlanning = async () => {
  const planning = await controller.generatePlanning();
  downloadPlanningPDF(planning);
};

window.searchTasksProjects = async () => {
  const query = (document.getElementById('search-input') as HTMLInputElement).value.toLowerCase();
  const tasks = await controller.getTasksByStatusAndProject();
  const projects = await controller.getAllProjects();
  const taskList = document.getElementById('todo-list');
  const projectList = document.getElementById('project-list');

  if (taskList && projectList) {
    taskList.innerHTML = '';
    tasks.forEach(task => {
      if (task.description.toLowerCase().includes(query) || task.projectId.toLowerCase().includes(query)) {
        const li = document.createElement('li');
        li.className = task.status === Status.Completed ? 'completed' : '';
        li.innerHTML = `
          <span>${task.description}</span>
          <span>Start: ${task.startDate}</span>
          <span>Planned End: ${task.plannedEndDate}</span>
          ${task.actualEndDate ? `<span>Actual End: ${task.actualEndDate}</span>` : ''}
          ${task.actualDuration !== null ? `<span>Duration: ${task.actualDuration}s</span>` : ''}
          <span>Status: ${task.status}</span>
          <div class="actions">
            <button onclick="startTask(${task.id})">Start</button>
            <button onclick="completeTask(${task.id})">Complete</button>
            <button onclick="editTask(${task.id})">Edit</button>
            <button onclick="deleteTask(${task.id})">Delete</button>
            <button onclick="getResources(${task.id})">Resources</button>
          </div>
        `;
        taskList.appendChild(li);
      }
    });

    projectList.innerHTML = '';
    projects.forEach(project => {
      if (project.name.toLowerCase().includes(query)) {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${project.name}</span>
          <button onclick="deleteProject('${project.id}')">Delete</button>
        `;
        projectList.appendChild(li);
      }
    });
  }
};

window.filterTasks = async () => {
  await loadTasks();
};

window.resetSearch = async () => {
  (document.getElementById('search-input') as HTMLInputElement).value = '';
  (document.getElementById('status-filter') as HTMLSelectElement).value = '';
  (document.getElementById('project-filter') as HTMLSelectElement).value = '';
  await loadTasks();
  await loadProjects();
};

async function downloadPlanningPDF(planning: string) {
  const doc = new jsPDF();

  // Paramètres de mise en page
  const pageWidth = doc.internal.pageSize.getWidth();  // Largeur de la page (environ 210 mm ou 595 pt)
  const pageHeight = doc.internal.pageSize.getHeight(); // Hauteur de la page (environ 297 mm ou 842 pt)
  const margin = 10;  // Marge en points
  const maxLineWidth = pageWidth - 2 * margin;  // Largeur maximale pour le texte
  let cursorY = margin;  // Position Y initiale

  // Définir la taille de la police
  doc.setFontSize(12);

  // Ajouter le titre
  doc.text("Task Planning", margin, cursorY);
  cursorY += 10;  // Décalage après le titre

  // Découper le texte en lignes adaptées à la largeur de la page
  const lines = doc.splitTextToSize(planning, maxLineWidth);

  // Parcourir les lignes et les ajouter au PDF
  const lineHeight = 10;  // Hauteur estimée par ligne (ajustez selon la taille de police)
  for (const line of lines) {
    if (cursorY + lineHeight > pageHeight - margin) {
      // Si on dépasse la hauteur de la page, ajouter une nouvelle page
      doc.addPage();
      cursorY = margin;  // Réinitialiser la position Y
    }
    doc.text(line, margin, cursorY);
    cursorY += lineHeight;  // Passer à la ligne suivante
  }

  // Sauvegarder le PDF
  doc.save('task_planning.pdf');
}

main().catch(console.error);
