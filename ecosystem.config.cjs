module.exports = {
  apps: [
    {
      name: "es2s-api",
      cwd: __dirname + "/backend",
      script: "/root/.bun/bin/bun",
      args: "src/index.ts",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
      out_file: "../logs/api-out.log",
      error_file: "../logs/api-err.log",
      merge_logs: true,
      time: true,
    },
  ],
};