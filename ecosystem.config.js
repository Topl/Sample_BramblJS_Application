module.exports = {
  apps: [
    {
      name: "Sample_BramblJS_Application",
      script: "./src/app.js",
      autorestart: true,
      watch: false,
      max_memory_restart: "700M",
      env_dev: {
        NODE_ENV: "dev",
        PORT: 8082
      },
      env_docker: {
        NODE_ENV: "default",
        PORT: 8082
      }
    }
  ]
};
