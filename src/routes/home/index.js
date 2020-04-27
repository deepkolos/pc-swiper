import { h } from 'preact'
import style from './style'
import Swiper, { Direction } from 'com/swiper'
import SwiperItem from 'com/swiper/item'
import { useRef, useEffect } from 'preact/hooks'

function random(min, max) {
  return Math.round(Math.random() * (max - min)) + min
}

function ColorfulDiv({ children, className }) {
  this.color =
    this.color || `rgb(${random(0, 180)}, ${random(0, 180)}, ${random(0, 180)})`

  return (
    <div className={className} style={{ backgroundColor: this.color }}>
      {children}
    </div>
  )
}

function Home() {
  const swiperRef = useRef()

  const siwperItems = [1, 2, 3].map(i => (
    <SwiperItem>
      <ColorfulDiv className={style.item}>{i}</ColorfulDiv>
    </SwiperItem>
  ))

  useEffect(() => {
    swiperRef.current.swipebleRange[1] = 1
  })

  return (
    <div class={style.home}>
      <h1>PC-Swiper</h1>
      <h3>横向滚动</h3>
      <Swiper>{siwperItems}</Swiper>

      <h3>纵向滚动</h3>
      <Swiper className={style.vertical} direction={Direction.vertical}>
        {siwperItems}
      </Swiper>

      <h3>横向-溢出回弹</h3>
      <Swiper overflow>{siwperItems}</Swiper>

      <h3>纵向-溢出回弹</h3>
      <Swiper
        overflow
        className={style.vertical}
        direction={Direction.vertical}
      >
        {siwperItems}
      </Swiper>

      <h3>可控范围-溢出回弹</h3>
      <Swiper overflow ref={swiperRef}>{siwperItems}</Swiper>

      <h3>横向-嵌套-纵向</h3>
      <Swiper>
        <SwiperItem>
          <ColorfulDiv className={style.item}>{1}</ColorfulDiv>
        </SwiperItem>

        <SwiperItem>
          <Swiper
            overflow
            className={style.vertical}
            direction={Direction.vertical}
          >
            {siwperItems}
          </Swiper>
        </SwiperItem>

        <SwiperItem>
          <ColorfulDiv className={style.item}>{1}</ColorfulDiv>
        </SwiperItem>
      </Swiper>

      <h3>纵向-嵌套-横向</h3>
      <Swiper className={style.vertical} direction={Direction.vertical}>
        <SwiperItem>
          <ColorfulDiv className={style.item}>纵向-1</ColorfulDiv>
        </SwiperItem>

        <SwiperItem>
          <Swiper overflow>{siwperItems}</Swiper>
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
          <Swiper>{siwperItems}</Swiper>
        </SwiperItem>

        <SwiperItem>
          <ColorfulDiv className={style.item}>横向-3</ColorfulDiv>
        </SwiperItem>
      </Swiper>
    </div>
  )
}

export default Home
