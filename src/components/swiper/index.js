/* eslint-disable no-case-declarations */
/* eslint-disable no-fallthrough */
import { h } from 'preact'
import style from './style'
import { Subject } from 'rxjs'
import { animate, tranX } from 'util/dom'
import SwiperContext from './context'
import RxSwipe, { Direction } from './rx-swipe'
import { useRef, useEffect } from 'preact/hooks'
import { map, scan, merge, filter } from 'rxjs/operators'
import { isInRange, diffToRange, restrictRange } from 'util/num'

const easeOutQuint = t => 1 + --t * t * t * t * t

// TODO: 支持带动画的命令切换页面
function Swiper({
  pool = 3,
  overflow,
  maxOverflow = 25,
  defaultIndex = 0,
  threshold = 0.13,
  flingDuration = 800,
  flingEaseFn = easeOutQuint,
  direction = Direction.horizontal,

  onSwipe,
  onSwipeEnd,
  onFlingEnd,

  children,
  className,
}) {
  const tab$ = new Subject()
  const fling$ = new Subject()
  const custom$ = new Subject()
  const tabUpdateOnFingEnd$ = new Subject()
  const ctx = { tab$, pool, tabUpdateOnFingEnd$ }
  const contentCanRef = useRef()
  const { startT$, moveT$, endT$, $$ } = RxSwipe()
  const initialState = {
    tabX: this.tabX === undefined ? 0 : this.tabX,
    tab: this.tab === undefined ? defaultIndex : this.tab,
  }

  this.swipebleRange = this.swipebleRange || [0, children.length - 1]

  children.forEach((node, i) => (node.props.index = i))

  $$.pipe(
    filter(({ startDir }) => !!(startDir & direction)),
    merge(fling$),
    merge(custom$.pipe(map(i => ({ type: 'custom', tab: i })))),
  )
    .pipe(
      scan((state, { e, type, deltaX, nextTabX, nextTab }) => {
        let { tab, tabX, tabSX } = state
        const [rangeStartTab, rangeEndTab] = this.swipebleRange

        if (type !== 'swipecancel' && e) {
          e.preventDefault()
          e.stopPropagation()
        }

        switch (type) {
          case 'swipestart':
            if (state.fling) state.fling.cancel()
            nextTabX = deltaX + tabX
            tabSX = tabX
          case 'swipemove': {
            nextTabX = deltaX + tabSX

            const curr = tab * -this.canW + nextTabX
            const min = rangeEndTab * -this.canW
            const max = rangeStartTab * -this.canW

            if (!isInRange(curr, min, max))
              nextTabX = overflow
                ? restrictRange(curr, min, max) -
                  tab * -this.canW +
                  Math.atan(diffToRange(curr, min, max) / maxOverflow) *
                    maxOverflow
                : 0

            return {
              ...state,
              tabSX,
              tabX: nextTabX,
            }
          }
          case 'swipeend': {
            // prettier-ignore
            const action =
              Math.abs(tabX / this.canW) > threshold
                ? tabX > 0
                  ? (tab === 0) || !isInRange(tab - 1, rangeStartTab, rangeEndTab)
                    ? 'stay'
                    : 'prev'
                  : (tab === children.length - 1) || !isInRange(tab + 1, rangeStartTab, rangeEndTab)
                    ? 'stay'
                    : 'next'
                : 'stay'

            const [finalTab, currTabX] = {
              prev: [tab - 1, tabX - this.canW], // 这里需要画图解决
              next: [tab + 1, this.canW + tabX], // 这里需要画图解决
              stay: [tab, tabX],
            }[action]

            // 这个时候需要改变基于的计算状态, 动画状态是当前已经跳转至那个位置
            const fling = animate(
              { x: currTabX },
              { x: 0 },
              flingDuration,
              ({ x }) =>
                fling$.next({
                  type: 'flingmove',
                  nextTabX: x,
                  nextTab: finalTab,
                }),
              flingEaseFn,
            ).then(() => fling$.next({ type: 'flingend' }))

            onSwipeEnd && onSwipeEnd(finalTab)
            return {
              fling,
              tab: finalTab,
              tabX: currTabX,
            }
          }
          case 'flingmove':
            return { ...state, tabX: nextTabX, tab: nextTab }
          case 'flingend':
            onFlingEnd && onFlingEnd(tab)
            tabUpdateOnFingEnd$.next(tab)
          default:
            return state
        }
      }, initialState),
    )
    .subscribe(({ tab, tabX }) => {
      this.tab = tab
      this.tabX = tabX
      const x = tab * -this.canW + tabX
      contentCanRef.current.style.transform = tranX(x)
      onSwipe && onSwipe(~~(-x / this.canW), (-x % this.canW) / this.canW)
    })

  useEffect(() => {
    tab$.next(defaultIndex)
    tabUpdateOnFingEnd$.next(defaultIndex)
    requestAnimationFrame(() => {
      if (!contentCanRef.current) return
      const { width, height } = contentCanRef.current.getBoundingClientRect()
      this.canW = width
      this.canH = height
      contentCanRef.current.style.transform = tranX(defaultIndex * -this.canW)
    })
  }, [defaultIndex])

  return (
    <div
      className={[style.can, className].join(' ')}
      onTouchStart={e => startT$.next(e)}
      onTouchMove={e => moveT$.next(e)}
      onTouchEnd={e => endT$.next(e)}
    >
      <SwiperContext.Provider value={ctx}>
        <div ref={contentCanRef} className={style.contentCan}>
          {children}
        </div>
      </SwiperContext.Provider>
    </div>
  )
}

export default Swiper
export { Direction }
