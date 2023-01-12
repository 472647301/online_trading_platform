import React, { useRef, useEffect } from "react";
import { connect } from "react-redux";
import { DataFeed } from "./datafeed";
import IEXCloud from "../../iexAPI/iexCloud";
import axios from "axios";
import day from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getSearchResult } from "../../redux/actions/searchAction";

day.extend(utc);
day.extend(timezone);
day.tz.setDefault(Intl.DateTimeFormat().resolvedOptions().timeZone);

const iex = new IEXCloud();

const intervalMap = {
  "10": "5dm",
  "30": "1mm",
  "1D": "5y",
};

function TradingView(props) {
  const container = useRef();
  const datafeed = useRef();
  const interval = useRef("1D");
  const widget = useRef();
  const loadend = useRef(false);
  const symbols = useRef([]);

  const initDatafeed = () => {
    datafeed.current = new DataFeed({
      DatafeedConfiguration: {
        supported_resolutions: Object.keys(intervalMap),
      },
      getBars: getBars,
      searchSymbols: searchSymbols,
      resolveSymbol: resolveSymbol,
    });
  };

  const resolveSymbol = (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback
  ) => {
    onSymbolResolvedCallback({
      name: symbolName,
      full_name: symbolName,
      description: "",
      type: "stock",
      session: "24x7",
      exchange: "",
      listed_exchange: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      format: "price",
      pricescale: Math.pow(10, 4),
      minmov: 1,
      volume_precision: 4,
      has_intraday: true,
      supported_resolutions: Object.keys(intervalMap),
      has_weekly_and_monthly: true,
      has_daily: true,
    });
  };

  const searchSymbols = async (userInput, _exchange, _symbolType, onResult) => {
    if (!symbols.current.length || !userInput) {
      onResult([]);
      return;
    }
    const res = [];
    for (let i = 0; i < symbols.current.length; i++) {
      const e = symbols.current[i];
      if (e.symbol.indexOf(userInput.toLocaleUpperCase()) !== -1) {
        res.push({
          symbol: e.symbol,
          full_name: e.exchangeName,
          description: e.name,
          exchange: e.exchange,
          ticker: e.symbol,
          type: e.type,
        });
      }
    }
    onResult(res);
  };

  const getBars = async (
    symbolInfo,
    resolution,
    periodParams,
    onResult,
    onError
  ) => {
    const bars = [];
    if (interval.current !== resolution) {
      interval.current = resolution;
    }
    if (!periodParams.firstDataRequest) {
      // 暂时不支持分段查询历史数据
      onResult(bars, { noData: true });
      return;
    }
    try {
      const res = await axios.get(
        iex.getFullUrl(
          "stock",
          symbolInfo.name,
          "chart",
          `/${intervalMap[resolution]}`
        )
      );
      if (!res.data || !res.data.length) {
        onResult(bars, { noData: true });
        return;
      }
      for (let i = 0; i < res.data.length; i++) {
        let time = 0;
        const item = res.data[i];
        if (item.minute) {
          time = day(`${item.date} ${item.minute}:00`).valueOf();
        } else {
          time = day(`${item.date} 00:00:00`).valueOf();
        }
        bars.push({
          time: time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        });
      }
      bars.sort((l, r) => (l.time > r.time ? 1 : -1));
      onResult(bars);
      loadend.current = true;
    } catch (err) {
      onError(err.message);
    }
  };

  const initTradingView = (symbol) => {
    widget.current = new window.TradingView.widget({
      locale: "en",
      fullscreen: true,
      theme: "Light",
      symbol: symbol,
      interval: interval.current,
      container: container.current,
      datafeed: datafeed.current,
      // library_path: "http://test.byronzhu.com/tv/charting_library/",
      library_path: "./charting_library/",
    });
    widget.current.onChartReady(() => {
      // 现在可以调用其他widget的方法了
      const chart = widget.current.activeChart();
      chart.onSymbolChanged().subscribe(null, (symbolInfo) => {
        props.getSearchResult([
          {
            label: symbolInfo.name,
            value: symbolInfo.name,
            name: symbolInfo.name,
          },
        ]);
      });
    });
  };

  useEffect(() => {
    symbols.current = props.symbols;
  }, [props.symbols]);

  useEffect(() => {
    if (!props.multi || !props.multi.length) {
      return;
    }
    loadend.current = false;
    const current = props.multi[props.multi.length - 1];
    initDatafeed();
    initTradingView(current.value);
    return () => {
      if (widget.current) {
        widget.current.remove();
      }
      loadend.current = false;
      interval.current = "1D";
      datafeed.current = null;
      widget.current = null;
    };
  }, [props.multi]);

  useEffect(() => {
    if (!loadend.current || !datafeed.current) return;
    datafeed.current.updateBar({
      time: props.quote.lastTradeTime,
      open: props.quote.open,
      high: props.quote.high,
      low: props.quote.low,
      close: props.quote.latestPrice,
      volume: props.quote.volume,
    });
  }, [props.quote]);

  return (
    <div
      ref={container}
      className="container"
      style={{ height: props.height }}
    />
  );
}

const mapStateToProps = (state) => {
  return {
    quote: state.iexReducer.quote,
    symbols: state.iexReducer.symbols,
    multi: state.searchReducer.multi,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    getSearchResult: (result) => dispatch(getSearchResult(result)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TradingView);
