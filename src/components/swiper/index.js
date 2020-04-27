/* eslint-disable no-case-declarations */
/* eslint-disable no-fallthrough */
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

function Swiper({
  pool = 3,
  threshold = 0.13,
  defaultIndex = 0,
  direction = Direction.horizontal,

  overflow,
  maxOverflow = 25,
  overflowThreshold = 20,

  flingDuration = 800,
  flingEaseFn = easeOutQuint,

  onSwipe,
  onSwipeEnd,
  onFlingEnd,
  onOverflow,

  children,
  className,
}) {
  const contentCanRef = useRef()
  this.disable = this.disable !== undefined ? this.disable : false
  this.swipebleRange = this.swipebleRange || [0, children.length - 1]
  this.horizontal = direction === Direction.horizontal

  const { ctx, endT$, moveT$, custom$, startT$, tabOnFingEnd$ } = useMemo(
    () => {
      const fling$ = new Subject()
      const custom$ = new Subject()
      const tabOnFingEnd$ = new Subject()
      const ctx = { pool, tabOnFingEnd$ }
      const { startT$, moveT$, endT$, $$ } = RxSwipe()

      const initialState = {
        tabX: this.tabX === undefined ? 0 : this.tabX,
        tab: this.tab === undefined ? defaultIndex : this.tab,
      }
      children.forEach((node, i) => (node.props.index = i))

      $$.pipe(
        // 不拦截的条件: 方向, 是否禁用, 初始方向是否可以swipe
        filter(
          ({ startDir }) =>
            !!(startDir & direction) &&
            !this.disable &&
            edgeCheck(
              startDir,
              this.horizontal ? ['right', 'left'] : ['down', 'up'],
              this.tab,
              children.length - 1,
            ),
        ),
        merge(fling$),
        merge(custom$.pipe(map(i => ({ type: 'custom', nextTab: i })))),
      )
        .pipe(
          scan((state, { e, type, deltaX, deltaY, nextTabX, nextTab }) => {
            let { tab, tabX, tabSX, overflowed } = state
            const [rangeStartTab, rangeEndTab] = this.swipebleRange
            const canW = this.horizontal ? this.canW : this.canH
            deltaX = this.horizontal ? deltaX : deltaY

            // 虽然聚合了,但是变量命名成了不少的问题
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
                      ? 'right'
                      : curr - overflowThreshold > max
                        ? 'left'
                        : ''
                  nextTabX = overflow
                    ? restrictRange(curr, min, max) -
                      tab * -canW +
                      Math.atan(diffToRange(curr, min, max) / maxOverflow) *
                        maxOverflow
                    : 0
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
                // prettier-ignore
                const action =
                Math.abs(tabX / canW) > threshold
                  ? tabX > 0
                    ? (tab === 0) || !isInRange(tab - 1, rangeStartTab, rangeEndTab)
                      ? 'stay'
                      : 'prev'
                    : (tab === children.length - 1) || !isInRange(tab + 1, rangeStartTab, rangeEndTab)
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

                onSwipeEnd && onSwipeEnd(tab)
                if (overflowed && onOverflow) onOverflow(overflowed)
                return {
                  fling,
                  tab: finalTab,
                  tabX: currTabX,
                }
              case 'flingmove':
                return { ...state, tabX: nextTabX, tab: nextTab }
              case 'flingend':
                onFlingEnd && onFlingEnd(tab)
                tabOnFingEnd$.next(tab)
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
          onSwipe && onSwipe(~~(-x / canW), (-x % canW) / canW)
        })

      // prettier-ignore
      return {
        ctx, endT$, moveT$, custom$,
        startT$, tabOnFingEnd$,
      }
    },
    // prettier-ignore
    [ pool, onSwipe, children, overflow, direction, threshold,
      onFlingEnd, onOverflow, onSwipeEnd, flingEaseFn, maxOverflow,
      defaultIndex, flingDuration, overflowThreshold ],
  )

  this.goto = i => {
    custom$.next(
      restrictRange(
        i,
        this.swipebleRange[0],
        Math.min(this.swipebleRange[1], children.length - 1),
      ),
    )
  }

  useEffect(() => {
    tabOnFingEnd$.next(defaultIndex)
    requestAnimationFrame(() => {
      if (!contentCanRef.current) return
      const { width, height } = contentCanRef.current.getBoundingClientRect()
      this.canW = width
      this.canH = height
      const canW = this.horizontal ? width : height
      contentCanRef.current.style.transform = tranX(defaultIndex * -canW)
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

export default Swiper
export { Direction }
