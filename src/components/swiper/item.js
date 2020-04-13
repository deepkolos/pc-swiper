import { h } from 'preact'
import style from './style'
import SwiperContext from './context'
import { useContext, useState, useEffect } from 'preact/hooks'

function SwiperItem({ children, index }) {
  const { tabUpdateOnFingEnd$, pool } = useContext(SwiperContext)
  const [show, setShow] = useState(false)
  const subscription = tabUpdateOnFingEnd$.subscribe(currIndex => {
    Math.abs(index - currIndex) < pool !== show &&
      setShow(Math.abs(index - currIndex) < pool)
  })
  useEffect(() => () => subscription.unsubscribe())

  return <div className={style.itemCan}>{show && children}</div>
}

export default SwiperItem
