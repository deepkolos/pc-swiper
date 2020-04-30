/* eslint-disable no-unused-vars */
/* eslint-disable no-fallthrough */
/* eslint-disable no-case-declarations */
import { h } from 'preact'
import style from './style'
import { Subject } from 'rxjs'
import SwiperContext from './context'
import { animate, tranX, tranY } from 'util/dom'
import RxSwipe, { Direction } from './rx-swipe'
import { useRef, useEffect, useMemo } from 'preact/hooks'
import { map, scan, merge, filter } from 'rxjs/operators'
import { isInRange, diffToRange, restrictRange } from 'util/num'

const easeOutQuint = t => 1 + --t * t * t * t * t

const edgeCheck = (startDir, [d1, d2], tab, max, min = 0) =>
  (!!(startDir & Direction[d1]) && tab !== min) ||
  (!!(startDir & Direction[d2]) && tab !== max)

const overflowThreshold = 5

function Swiper({
  pool = 3,
  index = 0,
  threshold = 0.13,
  direction = Direction.horizontal,
  swipeableRange,
  loop = false, // TODO: 增加循环支持

  overflow,
  maxOverflow = 25,

  flingDuration = 800,
  flingEaseFn = easeOutQuint,

  onProgress,
  onSwipeEnd,
  onFlingEnd,
  onOverflow,

  children,
  className,
}) {
  const contentCanRef = useRef()
  this.maxTab = children.length - 1
  this.disable = this.disable !== undefined ? this.disable : false
  this.swipeableRange = swipeableRange || [0, children.length - 1]
  this.horizontal = direction === Direction.horizontal
  // 略捞...
  this.loop = loop
  this.overflow = overflow
  this.direction = direction
  this.threshold = threshold
  this.onProgress = onProgress
  this.onFlingEnd = onFlingEnd
  this.onOverflow = onOverflow
  this.onSwipeEnd = onSwipeEnd
  this.flingEaseFn = flingEaseFn
  this.maxOverflow = maxOverflow
  this.flingDuration = flingDuration

  children.forEach((node, i) => (node.props.index = i))

  const { endT$, moveT$, custom$, startT$, tabOnFlingEnd$ } = useMemo(() => {
    const fling$ = new Subject()
    const custom$ = new Subject()
    const tabOnFlingEnd$ = new Subject()
    const { startT$, moveT$, endT$, $$ } = RxSwipe()

    const initialState = {
      tabX: this.tabX === undefined ? 0 : this.tabX,
      tab: this.tab === undefined ? index : this.tab,
    }

    $$.pipe(
      // 不拦截的条件: 方向, 是否禁用, 初始方向是否可以swipe
      filter(
        ({ startDir }) =>
          !!(startDir & this.direction) &&
          !this.disable &&
          (this.overflow ||
            edgeCheck(
              startDir,
              this.horizontal ? ['right', 'left'] : ['down', 'up'],
              this.tab,
              this.maxTab,
            )),
      ),
      merge(fling$),
      merge(custom$.pipe(map(i => ({ type: 'custom', nextTab: i })))),
    )
      .pipe(
        scan((state, { e, type, deltaX, deltaY, nextTabX, nextTab }) => {
          let { tab, tabX, tabSX, overflowed } = state
          const [rangeStartTab, rangeEndTab] = this.swipeableRange
          // prettier-ignore
          const { maxTab, overflow, threshold, onSwipeEnd, onOverflow, flingDuration,
                  onFlingEnd, maxOverflow, flingEaseFn, horizontal } = this
          const canW = horizontal ? this.canW : this.canH
          deltaX = horizontal ? deltaX : deltaY

          if (type !== 'swipecancel' && e) {
            e.preventDefault()
            e.stopPropagation()
          }

          switch (type) {
            case 'swipestart':
              if (state.fling) state.fling.cancel()
              nextTabX = deltaX + tabX
              tabSX = tabX
              overflowed = ''
            case 'swipemove': {
              nextTabX = deltaX + tabSX

              const curr = tab * -canW + nextTabX
              const min = rangeEndTab * -canW
              const max = rangeStartTab * -canW

              if (!isInRange(curr, min, max)) {
                // prettier-ignore
                overflowed =
                    curr + overflowThreshold < min
                      ? horizontal ? Direction.right : Direction.up
                      : curr - overflowThreshold > max
                        ? horizontal ? Direction.left : Direction.down
                        : ''
                nextTabX = overflow
                  ? restrictRange(curr, min, max) -
                    tab * -canW +
                    Math.atan(diffToRange(curr, min, max) / maxOverflow) *
                      maxOverflow
                  : restrictRange(curr, min, max) - tab * -canW
              }

              return {
                ...state,
                tabSX,
                tabX: nextTabX,
                overflowed,
              }
            }
            case 'custom': {
              const currTabX = (nextTab - tab) * canW + tabX
              if (state.fling) state.fling.cancel()
              const fling = animate(
                { x: currTabX },
                { x: 0 },
                flingDuration,
                ({ x }) =>
                  fling$.next({
                    type: 'flingmove',
                    nextTabX: x,
                    nextTab,
                  }),
                flingEaseFn,
              ).then(() => fling$.next({ type: 'flingend' }))

              return {
                fling,
                tab: nextTab,
                tabX: currTabX,
              }
            }
            case 'swipeend':
              // TODO: 支持多页滑动, 而非仅仅单页
              // prettier-ignore
              const action =
                  Math.abs(tabX / canW) > threshold
                    ? tabX > 0
                      ? (tab === 0) || !isInRange(tab - 1, rangeStartTab, rangeEndTab)
                        ? 'stay'
                        : 'prev'
                      : (tab === maxTab) || !isInRange(tab + 1, rangeStartTab, rangeEndTab)
                        ? 'stay'
                        : 'next'
                    : 'stay'

              const [finalTab, currTabX] = {
                prev: [tab - 1, tabX - canW], // 这里需要画图解决
                next: [tab + 1, canW + tabX], // 这里需要画图解决
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
              overflowed && onOverflow && onOverflow(overflowed)
              return {
                fling,
                tab: finalTab,
                tabX: currTabX,
              }
            case 'flingmove':
              return { ...state, tabX: nextTabX, tab: nextTab }
            case 'flingend':
              onFlingEnd && onFlingEnd(tab)
              tabOnFlingEnd$.next(tab)
            default:
              return state
          }
        }, initialState),
      )
      .subscribe(({ tab, tabX }) => {
        this.tab = tab
        this.tabX = tabX

        let canW = this.horizontal ? this.canW : this.canH
        const x = tab * -canW + tabX

        contentCanRef.current.style.transform = this.horizontal
          ? tranX(x)
          : tranY(x)
        this.onProgress && this.onProgress(~~(-x / canW), (-x % canW) / canW)
      })

    // prettier-ignore
    return {
        endT$, moveT$, custom$,
        startT$, tabOnFlingEnd$,
      }
  }, [])

  const ctx = useMemo(() => ({ pool, tabOnFlingEnd$ }), [pool, tabOnFlingEnd$])

  this.goto = i => {
    custom$.next(
      restrictRange(
        i,
        this.swipeableRange[0],
        Math.min(this.swipeableRange[1], this.maxTab),
      ),
    )
  }

  useEffect(() => {
    tabOnFlingEnd$.next(index)
    requestAnimationFrame(() => {
      if (!contentCanRef.current) return
      const { width, height } = contentCanRef.current.getBoundingClientRect()
      this.canW = width
      this.canH = height
      const canW = this.horizontal ? width : height
      contentCanRef.current.style.transform = tranX(index * -canW)
    })
  }, [index])

  return (
    <div
      className={[style.can, className].join(' ')}
      onTouchStart={e => startT$.next(e)}
      onTouchMove={e => moveT$.next(e)}
      onTouchEnd={e => endT$.next(e)}
    >
      <SwiperContext.Provider value={ctx}>
        <div
          ref={contentCanRef}
          className={`${style.contentCan} ${
            style[this.horizontal ? 'horizontal' : 'vertical']
          }`}
        >
          {children}
        </div>
      </SwiperContext.Provider>
    </div>
  )
}

Swiper.version = process.env.VERSION

export default Swiper
export { Direction, RxSwipe, Swiper }
export { default as SwiperItem } from './item.js'
