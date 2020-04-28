import { h } from 'preact'
import style from './style'
import { restrictRange } from 'util/num'
import { useRef, useState } from 'preact/hooks'
import Swiper, { SwiperItem, Direction } from 'com/swiper'

// import Swiper, { SwiperItem, Direction } from '../../../lib/pc-swiper.js' // 'com/swiper'
// import '../../../lib/pc-swiper.css'

function random(min, max) {
  return Math.round(Math.random() * (max - min)) + min
}

function ColorfulDiv({ children, className, style = {}, Ref }) {
  this.color =
    this.color || `rgb(${random(0, 180)}, ${random(0, 180)}, ${random(0, 180)})`

  return (
    <div
      ref={Ref}
      className={className}
      style={{ backgroundColor: this.color, ...style }}
    >
      {children}
    </div>
  )
}

function Home() {
  const pageSwiperRef = useRef()
  const customItemRefs = useRef([])

  const [pageIndex, setPageIndex] = useState(0)
  const [customIndex, setCustomIndex] = useState(0)

  const minScale = 0.7
  const maxScale = 1
  const diffScale = maxScale - minScale

  const onPageSwiperChange = i => {
    setPageIndex(i)
  }
  const onTabClick = i => {
    setPageIndex(i)
    pageSwiperRef.current.goto(i)
  }
  const onCustomProgress = (tab, percent) => {
    percent = restrictRange(percent, 0, 1)
    const $tabCurr = customItemRefs.current[tab]
    const $tabNext = customItemRefs.current[tab + 1]

    $tabCurr &&
      ($tabCurr.style.transform = `scale(${
        (1 - percent) * diffScale + minScale
      })`)

    $tabNext &&
      ($tabNext.style.transform = `scale(${percent * diffScale + minScale})`)
  }

  const createSwiperItems = (prefix, transform, ref) =>
    [1, 2, 3].map((v, k) => (
      <SwiperItem>
        <ColorfulDiv
          className={style.item}
          style={{
            transform: `scale(${
              !transform || k === customIndex ? 1 : 960 / 1110
            })`,
          }}
          Ref={el => ref && (ref.current[k] = el)}
        >
          {prefix}-{v}
        </ColorfulDiv>
      </SwiperItem>
    ))

  return (
    <div class={style.home}>
      <h1 className={style.title}>PC-Swiper</h1>
      <div className={style.tabCan}>
        {['基础', '嵌套', '自定义'].map((v, k) => (
          <div
            className={style.tab}
            data-active={pageIndex === k}
            onClick={() => onTabClick(k)}
          >
            {v}
          </div>
        ))}
      </div>

      <Swiper onSwipeEnd={onPageSwiperChange} overflow ref={pageSwiperRef}>
        <SwiperItem className={style.tabMainCan}>
          <h3>横向滚动</h3>
          <Swiper>{createSwiperItems('横向')}</Swiper>

          <h3>纵向滚动</h3>
          <Swiper className={style.vertical} direction={Direction.vertical}>
            {createSwiperItems('纵向')}
          </Swiper>

          <h3>横向-溢出回弹</h3>
          <Swiper overflow>{createSwiperItems('横向-溢出回弹')}</Swiper>

          <h3>纵向-溢出回弹</h3>
          <Swiper
            overflow
            className={style.vertical}
            direction={Direction.vertical}
          >
            {createSwiperItems('纵向-溢出回弹')}
          </Swiper>

          <h3>可控范围-溢出回弹</h3>
          <Swiper overflow swipeableRange={[0, 1]}>
            {createSwiperItems('可控范围-溢出回弹')}
          </Swiper>

          <h3>循环(TODO)</h3>
          <Swiper loop>{createSwiperItems('循环')}</Swiper>
        </SwiperItem>

        <SwiperItem className={style.tabMainCan}>
          <h3>横向-嵌套-纵向</h3>
          <Swiper>
            <SwiperItem>
              <ColorfulDiv className={style.item}>横向-1</ColorfulDiv>
            </SwiperItem>

            <SwiperItem>
              <Swiper
                overflow
                className={style.vertical}
                direction={Direction.vertical}
              >
                {createSwiperItems('嵌套-纵向')}
              </Swiper>
            </SwiperItem>

            <SwiperItem>
              <ColorfulDiv className={style.item}>横向-3</ColorfulDiv>
            </SwiperItem>
          </Swiper>

          <h3>纵向-嵌套-横向</h3>
          <Swiper className={style.vertical} direction={Direction.vertical}>
            <SwiperItem>
              <ColorfulDiv className={style.item}>纵向-1</ColorfulDiv>
            </SwiperItem>

            <SwiperItem>
              <Swiper overflow>{createSwiperItems('嵌套-横向')}</Swiper>
            </SwiperItem>

            <SwiperItem>
              <ColorfulDiv className={style.item}>纵向-3</ColorfulDiv>
            </SwiperItem>
          </Swiper>

          <h3>横向-嵌套-横向</h3>
          <Swiper>
            <SwiperItem>
              <ColorfulDiv className={style.item}>横向-1</ColorfulDiv>
            </SwiperItem>

            <SwiperItem>
              <Swiper>{createSwiperItems('嵌套-横向')}</Swiper>
            </SwiperItem>

            <SwiperItem>
              <ColorfulDiv className={style.item}>横向-3</ColorfulDiv>
            </SwiperItem>
          </Swiper>

          <h3>纵向-嵌套-纵向</h3>
          <Swiper className={style.vertical} direction={Direction.vertical}>
            <SwiperItem>
              <ColorfulDiv className={style.item}>纵向-1</ColorfulDiv>
            </SwiperItem>

            <SwiperItem>
              <Swiper className={style.vertical} direction={Direction.vertical}>
                {createSwiperItems('嵌套-纵向')}
              </Swiper>
            </SwiperItem>

            <SwiperItem>
              <ColorfulDiv className={style.item}>纵向-3</ColorfulDiv>
            </SwiperItem>
          </Swiper>
        </SwiperItem>

        <SwiperItem className={style.tabMainCan}>
          <h3>自定义</h3>
          <Swiper
            overflow
            onProgress={onCustomProgress}
            onFlingEnd={setCustomIndex}
          >
            {createSwiperItems('自定义', true, customItemRefs)}
          </Swiper>
        </SwiperItem>
      </Swiper>
    </div>
  )
}

export default Home
