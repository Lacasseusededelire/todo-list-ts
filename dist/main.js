var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsPDF } from 'jspdf';
import TaskController from './controllers/controller';
import { Status } from './models/models';
const controller = new TaskController();
/**
 *
 *
 * @return {*}  {Promise<void>}
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield controller.initialize();
        yield loadProjects();
        setupTaskForm();
        setupProjectForm();
        setupFilters();
        yield loadTasks();
    });
}
/**
 *
 *
 * @return {*}  {Promise<void>}
 */
function loadProjects() {
    return __awaiter(this, void 0, void 0, function* () {
        const projects = yield controller.getAllProjects();
        const projectList = document.getElementById('project-list');
        const projectSelect = document.getElementById('project-select');
        const projectFilter = document.getElementById('project-filter');
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
    });
}
/**
 *
 *
 */
function setupTaskForm() {
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.onsubmit = (event) => __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const description = document.getElementById('task-input').value;
            const plannedEndDate = new Date(document.getElementById('planned-end-date').value);
            const plannedEndTime = document.getElementById('planned-end-time').value;
            const projectId = document.getElementById('project-select').value || '';
            if (plannedEndTime) {
                const [hours, minutes] = plannedEndTime.split(':').map(Number);
                plannedEndDate.setHours(hours, minutes);
            }
            yield controller.createTask(description, plannedEndDate, projectId);
            yield loadTasks();
            taskForm.reset();
        });
    }
}
/**
 *
 *
 */
function setupProjectForm() {
    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        projectForm.onsubmit = (event) => __awaiter(this, void 0, void 0, function* () {
            event.preventDefault();
            const name = document.getElementById('project-input').value.trim().toLowerCase();
            const projects = yield controller.getAllProjects();
            if (projects.some(project => project.name.trim().toLowerCase() === name)) {
                alert('A project with this name already exists.');
                return;
            }
            yield controller.addProject(name);
            yield loadProjects();
            projectForm.reset();
        });
    }
}
/**
 *
 *
 * @return {*}  {Promise<void>}
 */
function loadTasks() {
    return __awaiter(this, void 0, void 0, function* () {
        const statusFilterValue = document.getElementById('status-filter').value;
        const statusFilter = statusFilterValue && Object.values(Status).includes(statusFilterValue)
            ? statusFilterValue
            : undefined;
        const projectFilter = document.getElementById('project-filter').value || undefined;
        console.log('Status Filter Value:', statusFilterValue); // Log pour vérifier
        console.log('Converted Status Filter:', statusFilter); // Log pour vérifier
        const tasks = yield controller.getTasksByStatusAndProject(statusFilter, projectFilter);
        console.log('Filtered Tasks:', tasks); // Log pour vérifier
        const taskList = document.getElementById('todo-list');
        if (taskList) {
            taskList.innerHTML = '';
            tasks.forEach(task => {
                var _a;
                const li = document.createElement('li');
                li.className = task.status === Status.Completed ? 'completed' : '';
                li.innerHTML = `
        <span>${task.description}</span>
        <span>Start: ${((_a = task.startDate) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || 'Not Started Yet'}</span>
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
    });
}
/**
 *
 *
 */
function setupFilters() {
    const statusFilterSelect = document.getElementById('status-filter');
    const projectFilterSelect = document.getElementById('project-filter');
    if (statusFilterSelect && projectFilterSelect) {
        statusFilterSelect.addEventListener('change', loadTasks);
        projectFilterSelect.addEventListener('change', loadTasks);
    }
}
window.startTask = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    yield controller.startTask(taskId);
    yield loadTasks();
});
window.completeTask = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    yield controller.completeTask(taskId);
    yield loadTasks();
});
window.editTask = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield controller.getTaskById(taskId);
    if (task) {
        const description = prompt('Edit task description:', task.description);
        const plannedEndDateInput = prompt('Edit planned end date (YYYY-MM-DD):', task.plannedEndDate.toISOString().split('T')[0]);
        const plannedEndTimeInput = prompt('Edit planned end time (HH:MM):', task.plannedEndDate.toTimeString().slice(0, 5));
        if (description !== null)
            task.description = description;
        if (plannedEndDateInput !== null && plannedEndTimeInput !== null) {
            const plannedEndDate = new Date(plannedEndDateInput);
            const [hours, minutes] = plannedEndTimeInput.split(':').map(Number);
            plannedEndDate.setHours(hours, minutes);
            task.plannedEndDate = plannedEndDate;
        }
        yield controller.updateTask(task);
        yield loadTasks();
    }
});
window.deleteTask = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    if (confirm('Are you sure you want to delete this task?')) {
        yield controller.deleteTask(taskId);
        yield loadTasks();
    }
});
window.getResources = (taskId) => __awaiter(void 0, void 0, void 0, function* () {
    const task = yield controller.getTaskById(taskId);
    if (task) {
        const resources = yield controller.getResourcesForTask(task.description);
        alert(resources);
    }
});
window.deleteProject = (projectId) => __awaiter(void 0, void 0, void 0, function* () {
    if (confirm('Are you sure you want to delete this project and all its tasks?')) {
        yield controller.deleteProject(projectId);
        yield loadProjects();
        yield loadTasks();
    }
});
window.generatePlanning = () => __awaiter(void 0, void 0, void 0, function* () {
    const planning = yield controller.generatePlanning();
    downloadPlanningPDF(planning);
});
window.searchTasksProjects = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = document.getElementById('search-input').value.toLowerCase();
    const tasks = yield controller.getTasksByStatusAndProject();
    const projects = yield controller.getAllProjects();
    const taskList = document.getElementById('todo-list');
    const projectList = document.getElementById('project-list');
    if (taskList && projectList) {
        taskList.innerHTML = '';
        tasks.filter(task => task.description.toLowerCase().includes(query) || task.projectId.toLowerCase().includes(query))
            .forEach(task => {
            var _a;
            const li = document.createElement('li');
            li.className = task.status === Status.Completed ? 'completed' : '';
            li.innerHTML = `
          <span>${task.description}</span>
          <span>Start: ${((_a = task.startDate) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || 'N/A'}</span>
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
});
window.filterTasks = () => __awaiter(void 0, void 0, void 0, function* () {
    yield loadTasks();
});
window.resetSearch = () => __awaiter(void 0, void 0, void 0, function* () {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('project-filter').value = '';
    yield loadTasks();
    yield loadProjects();
});
/**
 *
 *
 * @param {string} planning
 * @return {*}  {Promise<void>}
 */
function downloadPlanningPDF(planning) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
main().catch(console.error);
