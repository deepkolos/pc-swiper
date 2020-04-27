import path from 'path'
import WebpackAliasSyncPlugin from 'webpack-alias-sync-plugin'

const p = str => path.resolve(__dirname, str)

export default config => {
  config.resolve.alias = {
    ...config.resolve.alias,
    mock: p('./mocks/'),
    lib: p('./src/libs/'),
    img: p('./src/images/'),
    util: p('./src/utils/'),
    srv: p('./src/services'),
    com: p('./src/components/'),
  }

  config.node.process = 'mock'
  config.node.Buffer = true

  config.plugins.push(new WebpackAliasSyncPlugin())
}
