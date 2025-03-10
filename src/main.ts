import { jsPDF } from 'jspdf';
import TaskController from './controllers/controller';
import { Task, Project, Status } from './models/models';

const controller = new TaskController();

/**
 *
 *
 * @return {*}  {Promise<void>}
 */
async function main(): Promise<void> {
  await controller.initialize();
  await loadProjects();
  setupTaskForm();
  setupProjectForm();
  setupFilters();
  await loadTasks();
}

/**
 *
 *
 * @return {*}  {Promise<void>}
 */
async function loadProjects(): Promise<void> {
  const projects = await controller.getAllProjects();
  const projectList = document.getElementById('project-list') as HTMLElement;
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
      projectSelect.appendChild(option.cloneNode(true));
      projectFilter.appendChild(option);
    });
  }
}

/**
 *
 *
 */
function setupTaskForm(): void {
  const taskForm = document.getElementById('task-form') as HTMLFormElement;
  if (taskForm) {
    taskForm.onsubmit = async (event: Event) => {
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

/**
 *
 *
 */
function setupProjectForm(): void {
  const projectForm = document.getElementById('project-form') as HTMLFormElement;
  if (projectForm) {
    projectForm.onsubmit = async (event: Event) => {
      event.preventDefault();
      const name = (document.getElementById('project-input') as HTMLInputElement).value.trim().toLowerCase();
      const projects = await controller.getAllProjects();
      if (projects.some(project => project.name.trim().toLowerCase() === name)) {
        alert('A project with this name already exists.');
        return;
      }

      await controller.addProject(name);
      await loadProjects();
      projectForm.reset();
    };
  }
}

/**
 *
 *
 * @return {*}  {Promise<void>}
 */
async function loadTasks(): Promise<void> {
  const statusFilterValue = (document.getElementById('status-filter') as HTMLSelectElement).value;
  const statusFilter: Status | undefined = statusFilterValue && Object.values(Status).includes(statusFilterValue as Status)
    ? statusFilterValue as Status
    : undefined;
  const projectFilter = (document.getElementById('project-filter') as HTMLSelectElement).value || undefined;
  console.log('Status Filter Value:', statusFilterValue); // Log pour vérifier
  console.log('Converted Status Filter:', statusFilter);  // Log pour vérifier
  const tasks = await controller.getTasksByStatusAndProject(statusFilter, projectFilter);
  console.log('Filtered Tasks:', tasks);                  // Log pour vérifier
  const taskList = document.getElementById('todo-list') as HTMLElement;

  if (taskList) {
    taskList.innerHTML = '';
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = task.status === Status.Completed ? 'completed' : '';
      li.innerHTML = `
        <span>${task.description}</span>
        <span>Start: ${task.startDate?.toLocaleString() || 'Not Started Yet'}</span>
        <span>Planned End: ${task.plannedEndDate.toLocaleString()}</span>
        ${task.actualEndDate ? `<span>Actual End: ${task.actualEndDate.toLocaleString()}</span>` : ''}
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

/**
 *
 *
 */
function setupFilters(): void {
  const statusFilterSelect = document.getElementById('status-filter') as HTMLSelectElement;
  const projectFilterSelect = document.getElementById('project-filter') as HTMLSelectElement;

  if (statusFilterSelect && projectFilterSelect) {
    statusFilterSelect.addEventListener('change', loadTasks);
    projectFilterSelect.addEventListener('change', loadTasks);
  }
}

window.startTask = async (taskId: number): Promise<void> => {
  await controller.startTask(taskId);
  await loadTasks();
};

window.completeTask = async (taskId: number): Promise<void> => {
  await controller.completeTask(taskId);
  await loadTasks();
};

window.editTask = async (taskId: number): Promise<void> => {
  const task = await controller.getTaskById(taskId);
  if (task) {
    const description = prompt('Edit task description:', task.description);
    const plannedEndDateInput = prompt('Edit planned end date (YYYY-MM-DD):', task.plannedEndDate.toISOString().split('T')[0]);
    const plannedEndTimeInput = prompt('Edit planned end time (HH:MM):', task.plannedEndDate.toTimeString().slice(0, 5));

    if (description !== null) task.description = description;
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

window.deleteTask = async (taskId: number): Promise<void> => {
  if (confirm('Are you sure you want to delete this task?')) {
    await controller.deleteTask(taskId);
    await loadTasks();
  }
};

window.getResources = async (taskId: number): Promise<void> => {
  const task = await controller.getTaskById(taskId);
  if (task) {
    const resources = await controller.getResourcesForTask(task.description);
    alert(resources);
  }
};

window.deleteProject = async (projectId: string): Promise<void> => {
  if (confirm('Are you sure you want to delete this project and all its tasks?')) {
    await controller.deleteProject(projectId);
    await loadProjects();
    await loadTasks();
  }
};

window.generatePlanning = async (): Promise<void> => {
  const planning = await controller.generatePlanning();
  downloadPlanningPDF(planning);
};


window.searchTasksProjects = async (): Promise<void> => {
  const query = (document.getElementById('search-input') as HTMLInputElement).value.toLowerCase();
  const tasks = await controller.getTasksByStatusAndProject();
  const projects = await controller.getAllProjects();
  const taskList = document.getElementById('todo-list') as HTMLElement;
  const projectList = document.getElementById('project-list') as HTMLElement;

  if (taskList && projectList) {
    taskList.innerHTML = '';
    tasks.filter(task => task.description.toLowerCase().includes(query) || task.projectId.toLowerCase().includes(query))
      .forEach(task => {
        const li = document.createElement('li');
        li.className = task.status === Status.Completed ? 'completed' : '';
        li.innerHTML = `
          <span>${task.description}</span>
          <span>Start: ${task.startDate?.toLocaleString() || 'N/A'}</span>
          <span>Planned End: ${task.plannedEndDate.toLocaleString()}</span>
          ${task.actualEndDate ? `<span>Actual End: ${task.actualEndDate.toLocaleString()}</span>` : ''}
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

    projectList.innerHTML = '';
    projects.filter(project => project.name.toLowerCase().includes(query))
      .forEach(project => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${project.name}</span>
          <button onclick="deleteProject('${project.id}')">Delete</button>
        `;
        projectList.appendChild(li);
      });
  }
};

window.filterTasks = async (): Promise<void> => {
  await loadTasks();
};

window.resetSearch = async (): Promise<void> => {
  (document.getElementById('search-input') as HTMLInputElement).value = '';
  (document.getElementById('status-filter') as HTMLSelectElement).value = '';
  (document.getElementById('project-filter') as HTMLSelectElement).value = '';
  await loadTasks();
  await loadProjects();
};

/**
 *
 *
 * @param {string} planning
 * @return {*}  {Promise<void>}
 */
async function downloadPlanningPDF(planning: string): Promise<void> {
  const doc = new jsPDF();
  const margin = 10;
  const maxLineWidth = doc.internal.pageSize.getWidth() - 2 * margin;
  let cursorY = margin;

  doc.setFontSize(12);
  doc.text("Task Planning", margin, cursorY);
  cursorY += 10;

  const lines = doc.splitTextToSize(planning, maxLineWidth);
  const lineHeight = 10;

  for (const line of lines) {
    if (cursorY + lineHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  }

  doc.save('task_planning.pdf');
}

main().catch(console.error);