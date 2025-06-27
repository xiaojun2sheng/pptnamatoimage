import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/editor',
    name: 'Editor',
    component: () => import('../views/Editor.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 