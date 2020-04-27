import { h } from 'preact'
import style from './style'
import Swiper, { Direction } from 'com/swiper'
import SwiperItem from 'com/swiper/item'

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
  const siwperItems = [1, 2, 3].map(i => (
    <SwiperItem>
      <ColorfulDiv className={style.item}>{i}</ColorfulDiv>
    </SwiperItem>
  ))

  return (
    <div class={style.home}>
      <h1>PC-Swiper</h1>
      <h3>横向滚动</h3>
      <Swiper>{siwperItems}</Swiper>

      <h3>纵向滚动</h3>
      <Swiper className={style.vertical} direction={Direction.vertical}>{siwperItems}</Swiper>

      <h3>溢出回弹</h3>
      <Swiper overflow>{siwperItems}</Swiper>

      <h3>可控范围</h3>
      <Swiper>{siwperItems}</Swiper>
    </div>
  )
}

export default Home
