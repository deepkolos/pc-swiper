/* eslint-disable no-fallthrough */
import { Subject } from 'rxjs'
import { map, scan, merge, filter } from 'rxjs/operators'

export const mapXY = map(e => {
  if (!e.touches.length) return { e }
  return {
    e,
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
  }
})

// prettier-ignore
export const Direction = {
  left:       0b1000,
  right:      0b0100,
  up:         0b0010,
  down:       0b0001,
  vertical:   0b0011,
  horizontal: 0b1100,
}

// prettier-ignore
const getDir = (x, y) =>
  Number.isNaN(x) || Number.isNaN(y)
    ? -1
    : Math.abs(x) <= Math.abs(y)
      ? y < 0
        ? 0b0010
        : 0b0001
      : x < 0
        ? 0b1000
        : 0b0100

function RxSwipe(threshold = 5) {
  const startT$ = new Subject()
  const moveT$ = new Subject()
  const endT$ = new Subject()

  let lastState = {}
  let overThreshold = false

  const $$ = new Subject().pipe(
    merge(moveT$, endT$, startT$),
    mapXY,
    scan((state, { x, y, e }) => {
      // prettier-ignore
      let {
        type, startDir,
        lastX, lastY, startX, startY,
        deltaX, deltaY, deltaSX, deltaSY,
      } = state

      switch (e.type) {
        case 'touchstart':
          lastState = state
          overThreshold = false
          return {
            ...state,
            type: '',
            startX: x,
            startY: y,
            deltaSX: null,
            deltaSY: null,
            startDir: null,
          }
        case 'touchmove':
          type = type && overThreshold ? 'swipemove' : 'swipestart'
        case 'touchend':
          if (e.type === 'touchend') type = type ? 'swipeend' : 'swipecancel'

          lastX = x || lastX
          lastY = y || lastY
          deltaX = lastX - startX
          deltaY = lastY - startY
          deltaSX = deltaSX || deltaX
          deltaSY = deltaSY || deltaY
          lastState = state

          if (
            !overThreshold &&
            (Math.abs(deltaX) > threshold || Math.abs(deltaY))
          )
            overThreshold = true

          // prettier-ignore
          return {
            ...state, type, e, overThreshold,
            lastX, lastY, startX, startY,
            deltaX, deltaY, deltaSX, deltaSY,
            get endDir() { return getDir(deltaX, deltaY) },
            startDir: startDir || getDir(deltaSX, deltaSY),
          }
      }
    }, lastState),
    filter(state => state.overThreshold),
  )

  return { $$, endT$, moveT$, startT$ }
}

export default RxSwipe
