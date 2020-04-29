# pc-swiper

![https://travis-ci.com/deepkolos/pc-swiper](https://travis-ci.com/deepkolos/pc-swiper.svg?branch=master)
![](https://img.shields.io/npm/dt/pc-swiper.svg)
![](https://img.shields.io/npm/v/pc-swiper.svg)

一个使用`rxjs`做交互流程管理的swiper, 适用于`preact`项目, `hooks`编写, 有如下特性

1. 横向/纵向滚动
2. tab页面懒初始化
3. 溢出动画
4. 支持嵌套([横|纵]嵌[横|纵])+
5. 体积相对较小(压缩后26.6k, swiper.min.js则有124.9k)

# Live Demo

# Props

| 参数           | 类型      | 默认值                   | 描述                     |
| -------------- | --------- | ------------------------ | ------------------------ |
| index          | number    | 0                        | 默认参数                 |
| pool           | number    | 3                        | 初始化距离当前tab范围    |
| threshold      | number    | 0.13                     | 滑动到下一页阈值         |
| direction      | Direction | Direction.horizontal     | 方向                     |
| swipeableRange | Array     | [0, children.length - 1] | 可滚动范围, 用于条件滚动 |
| overflow       | boolean   | false                    | 溢出回弹                 |
| maxOverflow    | number    | 25                       | 最大可以出px             |
| flingDuration  | number    | 800                      | 手指离开屏幕后动画时长   |
| flingEaseFn    | Function  | easeOutQuint             | fling缓动函数            |
| className      | string    |                          | swiper根元素className    |

> 建议一下props更新通过拿`ref`更新, 比如: swiperRef.current.swipeableRange = [0, 1]

# Events

| 事件名     | 参数         | 描述                                                   |
| ---------- | ------------ | ------------------------------------------------------ |
| onProgress | ProgressInfo | 有位移/进度变化时触发                                  |
| onSwipeEnd | Info         | 当手指离开屏幕触发                                     |
| onFlingEnd | Info         | 当惯性滚动结束后触发                                   |
| onOverflow | OverflowInfo | 当手指离开屏幕且触发溢出时触发, 前置条件overflow: true |

### Event Params: ProgressInfo

| 参数    | 类型   | 描述              |
| ------- | ------ | ----------------- |
| tab     | number | 当前tab           |
| percent | number | 距离目标tab百分比 |

### Event Params: Info

| 参数 | 类型   | 描述    |
| ---- | ------ | ------- |
| tab  | number | 当前tab |


### Event Params: OverflowInfo

| 参数         | 类型      | 描述     |
| ------------ | --------- | -------- |
| overflowEdge | Direction | 溢出方向 |

# VM Public Methods

| 方法 | 参数          | 描述          |
| ---- | ------------- | ------------- |
| goto | index(number) | 跳转到目标tab |

# Demo Code

```jsx
function Page() {
  return <div>
    <Swiper>
      <SwiperItem>1</SwiperItem>
      <SwiperItem>2</SwiperItem>
      <SwiperItem>3</SwiperItem>
    </Swiper>
  </div>
}
```

# TODO

1. 滑动增益(win8.1 应用菜单所应用肉眼减少触控延迟的方法, 提高跟手感觉)
2. 横向滚动高度自适应(TBD, 可以通过onSwipe API可以实现, 只是一些初始化样式数据需要自己维护)
3. 溢出加载更多
5. 支持循环
6. 支持多页滑动, 而非仅仅单页
7. 溢出回弹可自定义
8. 支持PC

# License

MIT 造轮子锻炼抽象能力
