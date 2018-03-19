// See http://brunch.io for documentation.
exports.files = {
  javascripts: {
    joinTo: {
      'vendor.js': /^(?!app)/, // Files that are not in `app` dir.
      'config.js': [
        'app/config.js'
      ],
      'app.js': [
        // 'app/js/colors.js',               // include specific file
        // 'app/js/util.js',
        'app/index.js',
        'app/js/*'                        // all files with .js extension
      ],
    }
  },
  stylesheets: { joinTo: {
      'app.css': /^app/
    }
  }
};

// exports.overrides = {
//   production: {
//     optimize: true,
//     sourceMaps: false,
//     plugins: {autoReload: {enabled: false}}
//   }
// };

exports.plugins = {
  babel: {
    presets: ['env']
  },
  sass: {
    options: {
      includePaths: ['./node_modules/bootstrap/scss/'],
      precision: 8
    }
  }
};

exports.npm = {
  globals: {
    $: 'jquery',
    jQuery: 'jquery',
    Tether: 'tether',
  }
}
