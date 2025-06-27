<template>
  <div class="app-container">
    <nav class="nav-menu">
      <router-link to="/">首页</router-link>
      <router-link to="/editor">图文编辑器</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
}

.nav-menu {
  padding: 16px;
  background: #f0f2f5;
  margin-bottom: 20px;
}

.nav-menu a {
  margin-right: 20px;
  color: #1890ff;
  text-decoration: none;
}

.nav-menu a:hover {
  color: #40a9ff;
}

.nav-menu a.router-link-active {
  color: #096dd9;
  font-weight: bold;
}

/* 全局样式 */
body {
  margin: 0;
  padding: 0;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style> 