module.exports = {
  apps : [{
    name: 'e-courtier.core',
    script: 'index.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: 'one two',
    instances: 1,
    autorestart: true,
    watch: ['api.nodejs/src'],
    // Delay between restart
    watch_delay: 1000,
    ignore_watch : ["node_modules", "api.mongodb"],
    watch_options: {
      "followSymlinks": false
    },
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],

  deploy : {
    production : {
      user : 'junioressono@gmail.com',
      host : 'https://gitlab.com/',
      ref  : 'origin/master',
      repo : 'git@gitlab.com:chickdev/steam-core.git' +
          '',
      path : '/api.nodejs/dist',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
