//подключаем галп и плагины
var gulp = require('gulp'),
  imagemin = require('gulp-imagemin'),
  newer = require('gulp-newer'),
  del = require('del'),
  preprocess = require('gulp-preprocess'),
  htmlclean = require('gulp-htmlclean'),
  size = require('gulp-size'),
  sass = require('gulp-sass'),
  imacss = require('gulp-imacss'),
  jshint = require('gulp-jshint'),
  deporder = require('gulp-deporder'),
  concat = require('gulp-concat'),
  strip = require('gulp-strip-debug'),
  uglify = require('gulp-uglify'),
  browsersync = require('browser-sync'),
  pleeease = require('gulp-pleeease'),
  sourcemaps = require('gulp-sourcemaps'),
  urlAdjuster = require('gulp-css-url-adjuster'),
  plumber = require('gulp-plumber');


//расположение файлов 
var source = 'source/',
  dest = 'build/';

//переменная определяет версию production(возвращает false) или development(true)
//переменная NODE_ENV для различных версий билда 
var devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production');

//доступ к package.json
var pkg = require('./package.json');

//показать версию и тип билда
console.log(pkg.name + " " + pkg.version + ", " + (devBuild ? 'development' : 'production') + 'build');

//расположение картинок
var images = {
  on: source + 'images/*.*',
  out: dest + 'images'
};

//расположение изображений. кодируемых в uri
var imguri = {
  on: source + 'images/inline/*',
  out: source + 'scss/images/',
  filename: '_datauri.scss',
  namespace: 'img'
};

//расположение всех js-файлов
var js = {
  on: source + 'js/**/*',
  out: dest + 'js/',
  filename: 'main.js'
};

//объект для html-препроцессора
var html = {
  on: source + '*.html',
  watch: [source + '*.html', source + 'template/**/*'],
  out: dest,
  //используется для выведения инфо об авторе на сайте
  context: {
    devBuild: devBuild,
    author: pkg.author,
    version: pkg.version
  }
};

//объект для scss-препроцессора
var css = {
  on: source + 'scss/main.scss',
  //с помощью ! исключаем нужный файл из вотчера
  watch: [source + 'scss/**/*', '!' + imguri.out + imguri.filename],
  out: dest + 'css/',
  imagePath: '../images/',
  sassOpts: {
    outputStyle: 'compressed',
    // imagePath: '../images',
    precision: 3,
    errLogConsole: true
  },
  //опции для gulp-pleeease 
  pleeeaseOpts: {
    autoprefixer: {
      browsers: ['last 5 versions', '> 1%','ie 9', 'Opera 12.1']
    },
    rem: ['16px'],
    pseudoElements: true,
    mqpacker: true,
    minifier: !devBuild
  }
};

//расположение шрифтов
var fonts = {
  on: source + 'fonts/*.*',
  out: css.out + 'fonts/'
};

//опции для лайв-тестирования в браузере
var syncOpts = {
  server: {
    baseDir: dest,
    index: 'index.html'
  },
  open: true,
  notify: true
};

//оптимизация изображений
gulp.task('images', function() {
  return gulp.src(images.on)
    .pipe(newer(images.out))
    .pipe(imagemin())
    .pipe(gulp.dest(images.out));
});

//кодирование изображений в img:uri
gulp.task('imguri', function() {
  return gulp.src(imguri.on)
    .pipe(imagemin())
    .pipe(imacss(imguri.filename, imguri.namespace))
    .pipe(gulp.dest(imguri.out));
});

//копирование шрифтов
gulp.task('fonts', function() {
  return gulp.src(fonts.on)
    .pipe(newer(fonts.out))
    .pipe(gulp.dest(fonts.out));
});

//html-препроцессор
gulp.task('html', function() {
  var page = gulp.src(html.on).pipe(preprocess({
    context: html.context
  }));
  //если это production версия используем htmlcleaner()
  if (!devBuild) {
    //размер файла до минификации
    page = page.pipe(size({
        title: 'Html on'
      }))
      .pipe(htmlclean())
      //после минификации
      .pipe(size({
        title: 'Html out'
      }));
  }
  return page.pipe(gulp.dest(html.out));
});

//sass-препроцессор
gulp.task('sass', ['imguri'], function() {
  return gulp.src(css.on)
    .pipe(plumber())
    // .pipe(sourcemaps.init())
    .pipe(sass(css.sassOpts))
    //добавляем путь к картинкам в css
    .pipe(urlAdjuster({
      prependRelative: css.imagePath,
    }))
    .pipe(size({
      title: 'CSS on'
    }))
    .pipe(pleeease(css.pleeeaseOpts))
    .pipe(size({
      title: 'CSS out'
    }))
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest(css.out))
    .pipe(browsersync.reload({
      stream: true
    }));
});

//валидация js
gulp.task('js', function() {
  if (devBuild) {
    return gulp.src(js.on)
      .pipe(plumber())
      .pipe(newer(js.out))
      .pipe(jshint())
      .pipe(jshint.reporter('default'))
      .pipe(jshint.reporter('fail'))
      .pipe(gulp.dest(js.out));
  } else {
    del([dest + 'js/*']);
    return gulp.src(js.on)
      .pipe(plumber())
      .pipe(deporder())
      .pipe(concat(js.filename))
      .pipe(size({
        title: "JS on"
      }))
      .pipe(strip())
      .pipe(uglify())
      .pipe(size({
        title: "JS out"
      }))
      .pipe(gulp.dest(js.out));
  }
});

//очистка папки с билд-файлами
gulp.task('clean', function() {
  del([
    dest + '*'
  ]);
});

//live-тестирование в браузере
gulp.task('browsersync', function() {
  browsersync(syncOpts);
});

//дефолтный таск
gulp.task('default', ['html', 'sass', 'fonts', 'images', 'js', 'browsersync'], function() {

  //live-watcher html-препроцессора (индесный файл и все файлы шаблонов)  
  gulp.watch(html.watch, ['html', browsersync.reload]);

  //live-watcher минификации изображений 
  gulp.watch(images.on, ['images']);

  //live-watcher изменения шрифтов
  gulp.watch(fonts.on, ['fonts']);

  //live-watcher для SASS (мониторит не только sass-файлы, но и inline-изображения)
  gulp.watch([css.watch, imguri.on], ['sass']);

  //live-watcher для js
  gulp.watch(js.on, ['js', browsersync.reload]);
});
