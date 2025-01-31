/**
 * JS API
 * https://zlq4863947.gitbook.io/tradingview/3-shu-ju-bang-ding/js-api
 */

export class DataFeed {
  options
  subscribers = {}

  constructor(options) {
    this.options = options
  }

  /**
   * 此方法可以设置图表库支持的图表配置。这些数据会影响到图表支持的功能
   * @tips 图表初始化成功之后会回调这个函数,通过这个函数的callback参数传递DatafeedConfiguration配置给图表
   */
  async onReady(callback) {
    return new Promise(resolve => resolve(void 0)).then(() => {
      if (this.options.DatafeedConfiguration) {
        callback(this.options.DatafeedConfiguration)
      }
    })
  }

  /**
   * 提供一个匹配用户搜索的商品列表
   * @tips 图表头部搜索框搜索商品时触发，可以在这个函数请求自己服务器的商品，然后通过onResult传递给图表
   */
  async searchSymbols(userInput, exchange, symbolType, onResult) {
    // 如需请求自己服务器返回数据请添加相关代码
    // Example
    // fetch(`./api?userInput=${userInput}`, { method: "GET" }).then(
    //   async (res) => {
    //     const data: TradingView.SearchSymbolResultItem[] = await res.json();
    //     onResult(data); // 返回结构请参考SearchSymbolResultItem类型
    //   }
    // );
    if (this.options.searchSymbols) {
      return this.options.searchSymbols(
        userInput,
        exchange,
        symbolType,
        onResult
      )
    }
    return new Promise(resolve => resolve(void 0)).then(() => {
      onResult([])
    })
  }

  /**
   * 通过商品名称解析商品信息
   * @tips 图表初始化成功之后会回调这个函数，可以在这个函数请求自己服务器的商品配置信息，然后通过onSymbolResolvedCallback传递给图表
   */
  async resolveSymbol(
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback
  ) {
    // 如需请求自己服务器返回数据请添加相关代码，我这边在初始化图表的时候就请求服务端了，然后传递给了options对象
    // Example
    // fetch(`./api?symbolName=${symbolName}`, { method: "GET" }).then(
    //   async (res) => {
    //     const data: TradingView.LibrarySymbolInfo = await res.json();
    //     onSymbolResolvedCallback(data); // 返回结构请参考LibrarySymbolInfo类型
    //   }
    // );
    // return new Promise((resolve) => resolve(void 0)).then(() => {
    //   if (this.options.SymbolInfo) {
    //     onSymbolResolvedCallback(this.options.SymbolInfo);
    //   } else {
    //     onResolveErrorCallback("获取商品信息失败");
    //   }
    // });
    if (this.options.resolveSymbol) {
      return this.options.resolveSymbol(
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback
      )
    }
    return new Promise(resolve => resolve(void 0)).then(() => {
      onResolveErrorCallback('获取商品信息失败')
    })
  }

  /**
   * 当图表库需要由日期范围定义的历史K线片段时，将调用此函数
   * @tips 图表初始化成功之后会回调这个函数,可以在这个函数请求自己服务器的历史k线数据，然后通过onResult传递给图表
   */
  async getBars(symbolInfo, resolution, periodParams, onResult, onError) {
    if (!this.options.getBars) {
      return new Promise(resolve => resolve(void 0)).then(() => {
        onResult([])
      })
    }
    return this.options.getBars(
      symbolInfo,
      resolution,
      periodParams,
      onResult,
      onError
    )
  }

  /**
   * 订阅K线数据。图表库将调用onRealtimeCallback方法以更新实时数据
   * @tips 图表加载历史k线成功之后会回调这个函数
   */
  subscribeBars(
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    onResetCacheNeededCallback
  ) {
    if (this.subscribers[subscriberUID]) {
      return
    }
    this.subscribers[subscriberUID] = {
      lastBarTime: null,
      listener: onRealtimeCallback,
      resolution: resolution,
      symbolInfo: symbolInfo
    }
  }

  /**
   * 取消订阅K线数据
   */
  unsubscribeBars(subscriberUID) {
    if (!this.subscribers[subscriberUID]) {
      return
    }
    delete this.subscribers[subscriberUID]
  }

  /**
   * DataFeed 关键函数，我们通过这个函数传递实时数据给图表
   *  @tips 该函数不是JS API要求的函数，而是我们自己扩展的函数
   */
  updateBar(bar) {
    for (const listenerGuid in this.subscribers) {
      const subscriptionRecord = this.subscribers[listenerGuid]
      if (
        subscriptionRecord.lastBarTime !== null &&
        bar.time < subscriptionRecord.lastBarTime
      ) {
        // 如果实时数据时间小于最后一根k线的时间则跳过更新
        continue
      }
      subscriptionRecord.lastBarTime = bar.time
      subscriptionRecord.listener(bar)
    }
  }

  /**
   * 图表库调用这个函数来获得可见的K线范围的标记
   * @tips 如果DatafeedConfiguration开启了k线标记则图表会回调这个函数，通过onDataCallback返回标记数据给图表渲染
   */
  async getMarks(symbolInfo, startDate, endDate, onDataCallback, resolution) {
    // 如需请求自己服务器返回数据请添加相关代码
    // Example
    // fetch(`./api?symbolName=${symbolName}`, { method: "GET" }).then(
    //   async (res) => {
    //     const data: TradingView.Mark[] = await res.json();
    //     onDataCallback(data);
    //   }
    // );
  }

  /**
   * 图表库调用此函数获取可见K线范围的时间刻度标记
   * @tips 如果DatafeedConfiguration开启时间刻度标记则图表会回调这个函数，通过onDataCallback返回标记数据给图表渲染
   */
  async getTimescaleMarks(
    symbolInfo,
    startDate,
    endDate,
    onDataCallback,
    resolution
  ) {
    // 如需请求自己服务器返回数据请添加相关代码
    // Example
    // fetch(`./api?symbolName=${symbolName}`, { method: "GET" }).then(
    //   async (res) => {
    //     const data: TradingView.TimescaleMark[] = await res.json();
    //     onDataCallback(data);
    //   }
    // );
  }

  /**
   * 当图表需要知道服务器时间时，DatafeedConfiguration配置supports_time设置为true，则调用此函数
   * @tips 如果DatafeedConfiguration开启服务器时间则图表会回调这个函数，通过callback返回服务器时间给图表
   */
  getServerTime(callback) {
    // 如需请求自己服务器返回数据请添加相关代码
    // Example
    // fetch(`./api?symbolName=${symbolName}`, { method: "GET" }).then(
    //   async (res) => {
    //     const data: TradingView.ServerTimeCallback = await res.json();
    //     callback(data);
    //   }
    // );
  }
}
