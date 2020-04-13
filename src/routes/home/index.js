import { h } from 'preact'
import style from './style'
import Swiper from 'com/swiper'
import SwiperItem from 'com/swiper/item'

const Home = () => (
  <div class={style.home}>
    <Swiper>
      <SwiperItem>1</SwiperItem>
    </Swiper>
  </div>
)

export default Home
