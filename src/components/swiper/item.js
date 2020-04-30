import { h } from 'preact'
import style from './style'
import SwiperContext from './context'
import { useContext, useState, useEffect } from 'preact/hooks'

function SwiperItem({ children, index, className }) {
  const { tabOnFlingEnd$, pool } = useContext(SwiperContext)
  const [show, setShow] = useState(false)
  const subscription = tabOnFlingEnd$.subscribe(currIndex => {
    Math.abs(index - currIndex) < pool !== show &&
      setShow(Math.abs(index - currIndex) < pool)
  })
  useEffect(() => () => subscription.unsubscribe())

  return (
    <div className={`${style.itemCan} ${className}`}>{show && children}</div>
  )
}

export default SwiperItem
