const gulp = require('gulp')
const spritesmith = require('gulp.spritesmith')

gulp.task('sprite', function () {
  return gulp.src('image/*.png')//需要合并的图片地址
    .pipe(spritesmith({
      imgName: 'toolbar.png',
      imgPath: '/toolbar.png',
      cssName: 'toolbar.css',
      cssTemplate: (data) => {
        const arr = []
        data.sprites.forEach((sprite) => {
          arr.push(
            `.mu-picture-sprite-${sprite.name} {
              display: inline-block;
              vertical-align: middle;
              width: ${sprite.px.width};
              height: ${sprite.px.height};
              background: url("${data.spritesheet.image}") no-repeat;
              background-position: ${sprite.px.offset_x} ${sprite.px.offset_y};
            }`
          )
        })
        return arr.join('\n')
      }
    }))
    .pipe(gulp.dest('public/'))
})