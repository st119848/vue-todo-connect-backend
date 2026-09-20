<script setup>
import { computed, onMounted, ref } from 'vue'
import { todoApi } from './api/todos'

const todos = ref([])
const newTitle = ref('')
const filter = ref('all')
const loading = ref(true)
const adding = ref(false)
const error = ref('')
const editingId = ref(null)
const editingTitle = ref('')
const pendingIds = ref(new Set())

const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

const filteredTodos = computed(() => {
  if (filter.value === 'active') return todos.value.filter((todo) => !todo.completed)
  if (filter.value === 'completed') return todos.value.filter((todo) => todo.completed)
  return todos.value
})

const activeCount = computed(() => todos.value.filter((todo) => !todo.completed).length)
const completedCount = computed(() => todos.value.length - activeCount.value)
const progress = computed(() =>
  todos.value.length ? Math.round((completedCount.value / todos.value.length) * 100) : 0,
)

function setPending(id, pending) {
  const next = new Set(pendingIds.value)
  pending ? next.add(id) : next.delete(id)
  pendingIds.value = next
}

async function loadTodos() {
  loading.value = true
  error.value = ''
  try {
    const data = await todoApi.list()
    todos.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = `${err.message}. Make sure the Todo API is running on port 3000.`
  } finally {
    loading.value = false
  }
}

async function addTodo() {
  const title = newTitle.value.trim()
  if (!title || adding.value) return

  adding.value = true
  error.value = ''
  try {
    const created = await todoApi.create({ title, completed: false })
    todos.value.push(created)
    newTitle.value = ''
  } catch (err) {
    error.value = err.message
  } finally {
    adding.value = false
  }
}

async function toggleTodo(todo) {
  if (pendingIds.value.has(todo.id)) return
  setPending(todo.id, true)
  error.value = ''
  try {
    const updated = await todoApi.update(todo.id, {
      title: todo.title,
      completed: !todo.completed,
    })
    replaceTodo(updated)
  } catch (err) {
    error.value = err.message
  } finally {
    setPending(todo.id, false)
  }
}

function startEditing(todo) {
  if (pendingIds.value.has(todo.id)) return
  editingId.value = todo.id
  editingTitle.value = todo.title
}

function cancelEditing() {
  editingId.value = null
  editingTitle.value = ''
}

async function saveTodo(todo) {
  const title = editingTitle.value.trim()
  if (!title) return

  setPending(todo.id, true)
  error.value = ''
  try {
    const updated = await todoApi.update(todo.id, { title, completed: todo.completed })
    replaceTodo(updated)
    cancelEditing()
  } catch (err) {
    error.value = err.message
  } finally {
    setPending(todo.id, false)
  }
}

async function deleteTodo(todo) {
  if (pendingIds.value.has(todo.id)) return
  setPending(todo.id, true)
  error.value = ''
  try {
    await todoApi.remove(todo.id)
    todos.value = todos.value.filter((item) => item.id !== todo.id)
  } catch (err) {
    error.value = err.message
  } finally {
    setPending(todo.id, false)
  }
}

function replaceTodo(updated) {
  const index = todos.value.findIndex((todo) => todo.id === updated.id)
  if (index !== -1) todos.value[index] = updated
}

onMounted(loadTodos)
</script>

<template>
  <main class="page-shell">
    <section class="app-card" aria-labelledby="app-title">
      <header class="app-header">
        <div>
          <p class="eyebrow">My workspace</p>
          <h1 id="app-title">Things to do</h1>
          <p class="subtitle">A little progress each day adds up.</p>
        </div>
        <div class="progress-ring" :style="{ '--progress': `${progress * 3.6}deg` }" :aria-label="`${progress}% complete`">
          <div><strong>{{ progress }}%</strong><span>done</span></div>
        </div>
      </header>

      <form class="add-form" @submit.prevent="addTodo">
        <div class="input-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          <input
            v-model="newTitle"
            type="text"
            maxlength="160"
            placeholder="What needs to be done?"
            aria-label="New todo title"
          />
        </div>
        <button class="add-button" type="submit" :disabled="!newTitle.trim() || adding">
          {{ adding ? 'Adding…' : 'Add task' }}
        </button>
      </form>

      <div v-if="error" class="error-banner" role="alert">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5m0 3.5v.01M10.3 4.4 2.7 17.6A1.6 1.6 0 0 0 4.1 20h15.8a1.6 1.6 0 0 0 1.4-2.4L13.7 4.4a2 2 0 0 0-3.4 0Z" /></svg>
        <span>{{ error }}</span>
        <button type="button" aria-label="Dismiss error" @click="error = ''">×</button>
      </div>

      <div class="toolbar">
        <nav class="filters" aria-label="Filter todos">
          <button
            v-for="item in filters"
            :key="item.value"
            type="button"
            :class="{ active: filter === item.value }"
            @click="filter = item.value"
          >
            {{ item.label }}
          </button>
        </nav>
        <p v-if="todos.length" class="task-count">{{ activeCount }} {{ activeCount === 1 ? 'task' : 'tasks' }} left</p>
      </div>

      <div v-if="loading" class="loading-state" aria-live="polite">
        <span class="spinner"></span>
        <p>Gathering your tasks…</p>
      </div>

      <ul v-else-if="filteredTodos.length" class="todo-list">
        <li
          v-for="todo in filteredTodos"
          :key="todo.id"
          class="todo-item"
          :class="{ completed: todo.completed, pending: pendingIds.has(todo.id) }"
        >
          <button
            class="check-button"
            type="button"
            :aria-label="todo.completed ? `Mark ${todo.title} active` : `Mark ${todo.title} complete`"
            :disabled="pendingIds.has(todo.id)"
            @click="toggleTodo(todo)"
          >
            <svg v-if="todo.completed" viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 12 3.4 3.5 7.6-8" /></svg>
          </button>

          <form v-if="editingId === todo.id" class="edit-form" @submit.prevent="saveTodo(todo)">
            <input
              v-model="editingTitle"
              v-focus
              maxlength="160"
              aria-label="Edit todo title"
              @keyup.esc="cancelEditing"
            />
            <button type="submit" :disabled="!editingTitle.trim()">Save</button>
            <button type="button" @click="cancelEditing">Cancel</button>
          </form>

          <template v-else>
            <button class="todo-title" type="button" @dblclick="startEditing(todo)" @click="toggleTodo(todo)">
              {{ todo.title }}
            </button>
            <div class="item-actions">
              <button type="button" aria-label="Edit todo" title="Edit" @click="startEditing(todo)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.7 4.7L8 20l11-11-4-4L4 16Zm9.8-9.8 4 4" /></svg>
              </button>
              <button class="delete-button" type="button" aria-label="Delete todo" title="Delete" @click="deleteTodo(todo)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16m-10 4v5m4-5v5M9 7l1-3h4l1 3m3 0-1 14H7L6 7" /></svg>
              </button>
            </div>
          </template>
        </li>
      </ul>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8m-9 3h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm2 6 2 2 4-4" /></svg>
        </div>
        <h2>{{ todos.length ? `No ${filter} tasks` : 'Your list is clear' }}</h2>
        <p>{{ todos.length ? 'Try another filter to see your tasks.' : 'Add a task above and make today count.' }}</p>
      </div>

      <footer class="app-footer">
        <span><i class="status-dot"></i> Connected to Todo API</span>
        <span>Tip: double-click a task to edit</span>
      </footer>
    </section>
  </main>
</template>

<script>
export default {
  directives: {
    focus: {
      mounted(element) {
        element.focus()
        element.select()
      },
    },
  },
}
</script>
